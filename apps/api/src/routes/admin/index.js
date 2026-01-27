const prisma = require('../../prisma');
const notificationService = require('../../services/notification.service');
const auditService = require('../../services/audit.service');

module.exports = async function (fastify, opts) {
    // Middleware to check for Admin role
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            await request.jwtVerify();
            if (request.user.role !== 'ADMIN') {
                reply.status(403).send({ error: 'Admin access required' });
            }
            // Log admin access
            await auditService.log(request.user.id, 'ADMIN_ACCESS', { path: request.url });
        } catch (err) {
            reply.send(err);
        }
    });

    // Get all users
    fastify.get('/users', async (request, reply) => {
        const users = await prisma.user.findMany({
            include: {
                jobSeeker: { select: { fullName: true } },
                employer: { select: { companyName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return users;
    });

    // Get all employers (pending first)
    fastify.get('/employers', async (request, reply) => {
        const employers = await prisma.employer.findMany({
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return employers;
    });

    // Approve/Reject employer
    fastify.patch('/employers/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body; // APPROVED or REJECTED

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return reply.status(400).send({ error: 'Invalid status' });
        }

        try {
            const updatedEmployer = await prisma.employer.update({
                where: { id },
                data: { status }
            });

            // Trigger notification
            await notificationService.notify(updatedEmployer.userId, {
                title: `Account ${status}`,
                message: status === 'APPROVED'
                    ? 'Congratulations! Your employer account has been approved. You can now post jobs.'
                    : 'Your employer account verification was not successful. Please check your details and try again.',
                type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
                email: true
            });

            // Log status update
            await auditService.log(request.user.id, `EMPLOYER_${status}`, { employerId: id });

            return updatedEmployer;
        } catch (err) {
            return reply.status(404).send({ error: 'Employer not found' });
        }
    });

    // Get platform metrics
    fastify.get('/metrics', async (request, reply) => {
        const [userCount, employerCount, seekerCount, jobCount, appCount] = await Promise.all([
            prisma.user.count(),
            prisma.employer.count(),
            prisma.jobSeeker.count(),
            prisma.job.count(),
            prisma.application.count()
        ]);

        return {
            totalUsers: userCount,
            totalEmployers: employerCount,
            totalJobSeekers: seekerCount,
            totalJobs: jobCount,
            totalApplications: appCount
        };
    });
};
