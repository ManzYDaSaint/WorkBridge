const notificationService = require('../../services/notification.service');
const prisma = require('../../prisma');

module.exports = async function (fastify, opts) {
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Authentication required' });
        }
    });

    // GET /notifications
    fastify.get('/', async (request, reply) => {
        return await notificationService.getNotifications(request.user.id);
    });

    // PATCH /notifications/:id/read
    fastify.patch('/:id/read', async (request, reply) => {
        return await notificationService.markAsRead(request.params.id, request.user.id);
    });

    // POST /notifications/toggle-subscription
    fastify.post('/toggle-subscription', async (request, reply) => {
        const user = await prisma.user.findUnique({
            where: { id: request.user.id },
            include: { jobSeeker: true }
        });

        if (!user.jobSeeker) return reply.status(404).send({ error: 'Job seeker not found' });

        await prisma.jobSeeker.update({
            where: { userId: user.id },
            data: { isSubscribed: !user.jobSeeker.isSubscribed }
        });

        return { isSubscribed: !user.jobSeeker.isSubscribed };
    });
};
