const profileService = require('../services/profile.service');

module.exports = async function (fastify) {
  fastify.post('/profiles', async (request, reply) => {
    const body = request.body || {};
    const { userId, role, fullName, companyName, industry, location } = body;
    if (!userId || !role) return reply.status(400).send({ error: 'userId and role required' });
    try {
      return await profileService.createProfileFromAuth({ userId, role, fullName, companyName, industry, location });
    } catch (err) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/profiles/by-user/:userId', async (request, reply) => {
    const { userId } = request.params;
    try {
      return await profileService.getByUserId(userId);
    } catch (err) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.get('/profiles/employer/:employerId', async (request, reply) => {
    const { employerId } = request.params;
    try {
      const employer = await profileService.getEmployerById(employerId);
      if (!employer) return reply.status(404).send({ error: 'Employer not found' });
      return employer;
    } catch (err) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.get('/profiles/seekers/:seekerId', async (request, reply) => {
    const { seekerId } = request.params;
    try {
      const seeker = await profileService.getSeekerById(seekerId);
      if (!seeker) return reply.status(404).send({ error: 'Seeker not found' });
      return seeker;
    } catch (err) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.get('/profiles/employers', async () => {
    return profileService.getAllEmployers();
  });

  fastify.patch('/profiles/employers/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body || {};
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return reply.status(400).send({ error: 'status must be APPROVED or REJECTED' });
    }
    try {
      return await profileService.updateEmployerStatus(id, status);
    } catch (err) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.get('/profiles/stats', async () => {
    return profileService.getStats();
  });

  fastify.get('/profiles/seekers', async () => {
    return profileService.getAllSeekers();
  });
};
