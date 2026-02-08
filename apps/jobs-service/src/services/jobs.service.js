const prisma = require('../prisma');
const { callProfile, callNotifications, callAI } = require('../lib/http');

class JobsService {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(task) {
    this.queue.push(task);
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.processing = true;
    while (this.queue.length) {
      const task = this.queue.shift();
      try {
        await task();
      } catch (err) {
        console.error('Background task failed', err);
      }
    }
    this.processing = false;
  }
  async createJob(employerId, data) {
    const job = await prisma.job.create({ data: { employerId, ...data } });
    try {
      this.enqueue(() => this.rebuildShortlist(employerId, job.id, { notify: true }));
    } catch (err) {
      console.error('Shortlist generation failed', err);
    }
    return job;
  }

  async getJobs(filters = {}) {
    const { location, type, skills } = filters;
    const where = { isActive: true };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (type) where.type = type;
    if (skills && skills.length > 0) where.skills = { hasSome: skills };

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const employerIds = [...new Set(jobs.map((j) => j.employerId))];
    const employerMap = {};
    for (const eid of employerIds) {
      const emp = await callProfile(`/internal/profiles/employer/${eid}`);
      if (emp) employerMap[eid] = emp;
    }

    return jobs.map((j) => ({
      ...j,
      employer: employerMap[j.employerId] || { companyName: 'Unknown', location: j.location }
    }));
  }

  async getEmployerJobs(employerId) {
    const jobs = await prisma.job.findMany({
      where: { employerId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return jobs;
  }

  async applyToJob(seekerId, jobId) {
    return prisma.application.create({ data: { seekerId, jobId } });
  }

  async getJobApplicants(employerId, jobId) {
    const job = await prisma.job.findFirst({ where: { id: jobId, employerId } });
    if (!job) throw new Error('Job not found or access denied');

    const applications = await prisma.application.findMany({ where: { jobId } });
    const applicants = [];
    for (const app of applications) {
      const seeker = await callProfile(`/internal/profiles/seekers/${app.seekerId}`);
      if (!seeker) continue;
      const jobSkills = job.skills || [];
      const seekerSkills = seeker.skills || [];
      const intersection = seekerSkills.filter((s) =>
        jobSkills.some((js) => js.toLowerCase() === s.toLowerCase())
      );
      const matchScore = jobSkills.length > 0 ? Math.round((intersection.length / jobSkills.length) * 100) : 0;
      applicants.push({ ...app, jobSeeker: seeker, matchScore });
    }
    return applicants.sort((a, b) => b.matchScore - a.matchScore);
  }

  async rebuildShortlist(employerId, jobId, { notify = false } = {}) {
    const job = await prisma.job.findFirst({ where: { id: jobId, employerId } });
    if (!job) throw new Error('Job not found or access denied');

    const limit = Number(process.env.SHORTLIST_LIMIT || 50);
    const minScore = Number(process.env.SHORTLIST_MIN_SCORE || 20);
    const response = await callAI('/ai/match/job', {
      job,
      options: { limit, minScore }
    });
    const candidates = response?.candidates || [];

    await prisma.shortlistCandidate.deleteMany({ where: { jobId } });
    if (candidates.length) {
      await prisma.shortlistCandidate.createMany({
        data: candidates.map((c) => ({
          jobId,
          seekerId: c.seekerId,
          score: c.score,
          reasons: c.reasons || []
        }))
      });
    }

    if (notify) {
      const notifyLimit = Number(process.env.SHORTLIST_NOTIFY_LIMIT || 20);
      const shouldNotify = String(process.env.NOTIFY_MATCHED || 'true').toLowerCase() === 'true';
      if (shouldNotify) {
        const targets = candidates.filter((c) => c.isSubscribed).slice(0, notifyLimit);
        for (const candidate of targets) {
          if (!candidate.userId) continue;
          callNotifications('/internal/notify', {
            userId: candidate.userId,
            title: 'New Matching Job',
            message: `A new job "${job.title}" matches your profile.`,
            type: 'INFO',
            email: true
          });
        }
      }
    }

    return candidates;
  }

  async getShortlist(employerId, jobId) {
    const job = await prisma.job.findFirst({ where: { id: jobId, employerId } });
    if (!job) throw new Error('Job not found or access denied');

    const shortlist = await prisma.shortlistCandidate.findMany({
      where: { jobId },
      orderBy: { score: 'desc' }
    });

    const enriched = [];
    for (const item of shortlist) {
      const seeker = await callProfile(`/internal/profiles/seekers/${item.seekerId}`);
      if (!seeker) continue;
      enriched.push({
        ...item,
        jobSeeker: seeker
      });
    }
    return enriched;
  }

  async notifySelectedCandidates(employerId, jobId, seekerIds = []) {
    const job = await prisma.job.findFirst({ where: { id: jobId, employerId } });
    if (!job) throw new Error('Job not found or access denied');
    if (!Array.isArray(seekerIds) || seekerIds.length === 0) return { notified: 0 };

    const uniqueIds = Array.from(new Set(seekerIds));
    let notified = 0;
    for (const seekerId of uniqueIds) {
      const seeker = await callProfile(`/internal/profiles/seekers/${seekerId}`);
      if (!seeker?.userId) continue;
      await callNotifications('/internal/notify', {
        userId: seeker.userId,
        title: 'You are selected',
        message: `You have been selected for "${job.title}". Please wait for interview details.`,
        type: 'SUCCESS',
        email: true,
        sms: true
      });
      notified += 1;
    }

    return { notified };
  }

  async updateApplicationStatus(employerId, applicationId, status) {
    const valid = ['REVIEWED', 'SHORTLISTED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'];
    if (!valid.includes(status)) throw new Error('Invalid status');

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true }
    });
    if (!application || application.job.employerId !== employerId) {
      throw new Error('Application not found or access denied');
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status }
    });

    const seeker = await callProfile(`/internal/profiles/seekers/${updated.seekerId}`);
    const job = application.job;
    if (seeker?.userId && job) {
      callNotifications('/internal/notify', {
        userId: seeker.userId,
        title: `Application Update: ${status}`,
        message: `Your application for "${job.title}" has been moved to ${status}.`,
        type: status === 'REJECTED' ? 'ERROR' : 'SUCCESS',
        email: true,
        sms: true
      });
    }

    return updated;
  }
}

module.exports = new JobsService();
