const notificationService = require('../services/notification.service');

module.exports = async function (fastify) {
  fastify.post('/notify', async (request, reply) => {
    const body = request.body || {};
    const { userId, title, message, type, email, sms } = body;
    if (!userId || !title || !message) {
      return reply.status(400).send({ error: 'userId, title, and message required' });
    }
    try {
      return await notificationService.notify(userId, {
        title,
        message,
        type: type || 'INFO',
        email: !!email,
        sms: !!sms
      });
    } catch (err) {
      return reply.status(500).send({ error: err.message });
    }
  });
};
