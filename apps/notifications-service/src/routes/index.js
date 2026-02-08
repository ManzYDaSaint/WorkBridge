const notificationService = require('../services/notification.service');

const requireAuth = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Authentication required' });
  }
};

module.exports = async function (fastify) {
  fastify.get('/', { preHandler: requireAuth }, async (request) => {
    return notificationService.getNotifications(request.user.id);
  });

  fastify.patch('/:id/read', { preHandler: requireAuth }, async (request) => {
    return notificationService.markAsRead(request.params.id, request.user.id);
  });

  fastify.get('/health', async () => ({ status: 'ok', service: 'notifications', timestamp: new Date().toISOString() }));
};
