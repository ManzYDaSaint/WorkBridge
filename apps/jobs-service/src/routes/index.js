const jobsService = require('../services/jobs.service');
const { callProfile } = require('../lib/http');
const prisma = require('../prisma');
const { callNotifications } = require('../lib/http');
const { z } = require('zod');

const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  skills: z.array(z.string().min(1)).default([]),
  location: z.string().min(2),
  type: z.string().min(2),
  salaryRange: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['REVIEWED', 'SHORTLISTED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'])
});

const notifySelectedSchema = z.object({
  seekerIds: z.array(z.string().min(1)).min(1)
});

const requireAuth = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Authentication required' });
  }
};

module.exports = async function (fastify) {
  fastify.get('/', async (request, reply) => {
    const filters = request.query;
    return jobsService.getJobs(filters);
  });

  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Only employers can post jobs' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const employer = profile?.employer;
    if (!employer || employer.status !== 'APPROVED') {
      return reply.status(403).send({ error: 'Your employer account must be approved to post jobs' });
    }

    const jobData = createJobSchema.parse(request.body);
    return jobsService.createJob(employer.id, jobData);
  });

  fastify.get('/my-jobs', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Access denied' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const employer = profile?.employer;
    if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

    return jobsService.getEmployerJobs(employer.id);
  });

  fastify.post('/:id/apply', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'JOB_SEEKER') return reply.status(403).send({ error: 'Only job seekers can apply' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const seeker = profile?.jobSeeker;
    if (!seeker) return reply.status(404).send({ error: 'Job seeker profile not found' });

    try {
      const application = await jobsService.applyToJob(seeker.id, request.params.id);
      const job = await prisma.job.findUnique({
        where: { id: request.params.id },
        include: { applications: false }
      });
      const employer = job ? await callProfile(`/internal/profiles/employer/${job.employerId}`) : null;
      const employerUserId = employer?.userId;
      if (employerUserId) {
        callNotifications('/internal/notify', {
          userId: employerUserId,
          title: 'New Application',
          message: `${seeker.fullName} has applied for your position: ${job?.title || 'a job'}`,
          type: 'INFO',
          email: true
        });
      }
      return application;
    } catch (err) {
      if (err.code === 'P2002') return reply.status(400).send({ error: 'You have already applied to this job' });
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/:id/applicants', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Access denied' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const employer = profile?.employer;
    if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

    try {
      return await jobsService.getJobApplicants(employer.id, request.params.id);
    } catch (err) {
      return reply.status(403).send({ error: err.message });
    }
  });

  fastify.get('/:id/shortlist', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Access denied' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const employer = profile?.employer;
    if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

    try {
      return await jobsService.getShortlist(employer.id, request.params.id);
    } catch (err) {
      return reply.status(403).send({ error: err.message });
    }
  });

  fastify.post('/:id/shortlist/rebuild', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Access denied' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const employer = profile?.employer;
    if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

    try {
      const candidates = await jobsService.rebuildShortlist(employer.id, request.params.id, { notify: true });
      return { jobId: request.params.id, count: candidates.length };
    } catch (err) {
      return reply.status(403).send({ error: err.message });
    }
  });

  fastify.post('/:id/shortlist/notify', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Access denied' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const employer = profile?.employer;
    if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

    const { seekerIds } = notifySelectedSchema.parse(request.body || {});
    try {
      return await jobsService.notifySelectedCandidates(employer.id, request.params.id, seekerIds);
    } catch (err) {
      return reply.status(403).send({ error: err.message });
    }
  });

  fastify.patch('/applications/:id/status', { preHandler: requireAuth }, async (request, reply) => {
    const { id: userId, role } = request.user;
    if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Access denied' });

    const profile = await callProfile(`/internal/profiles/by-user/${userId}`);
    const employer = profile?.employer;
    if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

    const { status } = updateStatusSchema.parse(request.body);
    try {
      return await jobsService.updateApplicationStatus(employer.id, request.params.id, status);
    } catch (err) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/health', async () => ({ status: 'ok', service: 'jobs', timestamp: new Date().toISOString() }));
};
