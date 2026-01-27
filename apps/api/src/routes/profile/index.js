const profileService = require('../../services/profile.service');

module.exports = async function (fastify, opts) {
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Authentication required' });
        }
    });

    // GET /profile
    fastify.get('/', async (request, reply) => {
        try {
            return await profileService.getProfile(request.user.id);
        } catch (err) {
            reply.status(404).send({ error: err.message });
        }
    });

    // PUT /profile
    fastify.put('/', async (request, reply) => {
        return await profileService.updateProfile(request.user.id, request.body);
    });

    // POST /profile/resume
    fastify.post('/resume', async (request, reply) => {
        const data = await request.file();
        if (!data) return reply.status(400).send({ error: 'No file uploaded' });

        // Convert stream to buffer
        const buffer = await data.toBuffer();

        try {
            return await profileService.uploadResume(request.user.id, { buffer });
        } catch (err) {
            reply.status(500).send({ error: err.message });
        }
    });
};
