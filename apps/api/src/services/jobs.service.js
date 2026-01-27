const prisma = require('../prisma');

class JobsService {
    async createJob(employerId, data) {
        return await prisma.job.create({
            data: {
                employerId,
                ...data,
            },
        });
    }

    async getJobs(filters = {}) {
        const { location, type, skills } = filters;
        const where = { isActive: true };

        if (location) where.location = { contains: location, mode: 'insensitive' };
        if (type) where.type = type;
        if (skills && skills.length > 0) {
            where.skills = { hasSome: skills };
        }

        return await prisma.job.findMany({
            where,
            include: { employer: { select: { companyName: true, location: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getEmployerJobs(employerId) {
        return await prisma.job.findMany({
            where: { employerId },
            include: { _count: { select: { applications: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async applyToJob(seekerId, jobId) {
        return await prisma.application.create({
            data: {
                seekerId,
                jobId,
            },
        });
    }

    async getJobApplicants(employerId, jobId) {
        const job = await prisma.job.findFirst({
            where: { id: jobId, employerId },
        });

        if (!job) throw new Error('Job not found or access denied');

        const applicants = await prisma.application.findMany({
            where: { jobId },
            include: { jobSeeker: true },
        });

        // Calculate match scores
        return applicants.map(app => {
            const seekerSkills = app.jobSeeker.skills || [];
            const jobSkills = job.skills || [];

            const intersection = seekerSkills.filter(s =>
                jobSkills.some(js => js.toLowerCase() === s.toLowerCase())
            );

            const matchScore = jobSkills.length > 0
                ? Math.round((intersection.length / jobSkills.length) * 100)
                : 0;

            return { ...app, matchScore };
        }).sort((a, b) => b.matchScore - a.matchScore);
    }

    async updateApplicationStatus(employerId, applicationId, status) {
        const validStatuses = ['REVIEWED', 'SHORTLISTED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'];
        if (!validStatuses.includes(status)) throw new Error('Invalid status');

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: true }
        });

        if (!application || application.job.employerId !== employerId) {
            throw new Error('Application not found or access denied');
        }

        return await prisma.application.update({
            where: { id: applicationId },
            data: { status }
        });
    }
}

module.exports = new JobsService();
