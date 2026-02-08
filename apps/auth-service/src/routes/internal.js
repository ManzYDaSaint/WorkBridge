const prisma = require('../prisma');

module.exports = async function (fastify) {
  fastify.get('/users', async () => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return users;
  });

  fastify.get('/stats', async () => {
    const totalUsers = await prisma.user.count();
    return { totalUsers };
  });

  fastify.get('/users/:userId', async (request, reply) => {
    const { userId } = request.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true }
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return user;
  });
};
