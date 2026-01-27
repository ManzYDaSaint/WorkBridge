const jobsService = require('../../services/jobs.service');
const prisma = require('../../prisma');
const notificationService = require('../../services/notification.service');

module.exports = async function (fastify, opts) {
    // Authentication hook
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Authentication required' });
        }
    });

    // GET /jobs - Public/Seeker Browse
    fastify.get('/', async (request, reply) => {
        const filters = request.query;
        return await jobsService.getJobs(filters);
    });

    // POST /jobs - Create Job (Employers only)
    fastify.post('/', async (request, reply) => {
        const { id: userId, role } = request.user;
        if (role !== 'EMPLOYER') {
            return reply.status(403).send({ error: 'Only employers can post jobs' });
        }

        const employer = await prisma.employer.findUnique({ where: { userId } });
        if (!employer || employer.status !== 'APPROVED') {
            return reply.status(403).send({ error: 'Your employer account must be approved to post jobs' });
        }

        const jobData = request.body;
        return await jobsService.createJob(employer.id, jobData);
    });

    // GET /jobs/my-jobs - Employer's own jobs
    fastify.get('/my-jobs', async (request, reply) => {
        const { id: userId, role } = request.user;
        if (role !== 'EMPLOYER') {
            return reply.status(403).send({ error: 'Access denied' });
        }

        const employer = await prisma.employer.findUnique({ where: { userId } });
        if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

        return await jobsService.getEmployerJobs(employer.id);
    });

    // POST /jobs/:id/apply - Job Seeker Apply
    fastify.post('/:id/apply', async (request, reply) => {
        const { id: userId, role } = request.user;
        if (role !== 'JOB_SEEKER') {
            return reply.status(403).send({ error: 'Only job seekers can apply' });
        }

        const seeker = await prisma.jobSeeker.findUnique({ where: { userId } });
        if (!seeker) return reply.status(404).send({ error: 'Job seeker profile not found' });

        try {
            const application = await jobsService.applyToJob(seeker.id, request.params.id);

            // Notify Employer
            const job = await prisma.job.findUnique({
                where: { id: request.params.id },
                include: { employer: true }
            });

            await notificationService.notify(job.employer.userId, {
                title: 'New Application',
                message: `${seeker.fullName} has applied for your position: ${job.title}`,
                type: 'INFO',
                email: true
            });

            return application;
        } catch (err) {
            if (err.code === 'P2002') {
                return reply.status(400).send({ error: 'You have already applied to this job' });
            }
            return reply.status(400).send({ error: err.message });
        }
    });

    // GET /jobs/:id/applicants - Employer view applicants
    fastify.get('/:id/applicants', async (request, reply) => {
        const { id: userId, role } = request.user;
        if (role !== 'EMPLOYER') {
            return reply.status(403).send({ error: 'Access denied' });
        }

        const employer = await prisma.employer.findUnique({ where: { userId } });
        if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

        try {
            return await jobsService.getJobApplicants(employer.id, request.params.id);
        } catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // PATCH /jobs/applications/:id/status
    fastify.patch('/applications/:id/status', async (request, reply) => {
        const { id: userId, role } = request.user;
        if (role !== 'EMPLOYER') return reply.status(403).send({ error: 'Access denied' });

        const employer = await prisma.employer.findUnique({ where: { userId } });
        if (!employer) return reply.status(404).send({ error: 'Employer profile not found' });

        const { status } = request.body;
        try {
            const updated = await jobsService.updateApplicationStatus(employer.id, request.params.id, status);

            // Notify Seeker
            const seeker = await prisma.jobSeeker.findUnique({ where: { id: updated.seekerId } });
            const job = await prisma.job.findUnique({ where: { id: updated.jobId } });

            await notificationService.notify(seeker.userId, {
                title: `Application Update: ${status}`,
                message: `Your application for "${job.title}" has been moved to ${status}.`,
                type: status === 'REJECTED' ? 'ERROR' : 'SUCCESS',
                email: true,
                sms: true
            });

            return updated;
        } catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
};
