const prisma = require('../prisma');

module.exports = async function (fastify) {
  fastify.get('/stats', async () => {
    const [totalJobs, totalApplications] = await Promise.all([
      prisma.job.count(),
      prisma.application.count()
    ]);
    return { totalJobs, totalApplications };
  });
};
