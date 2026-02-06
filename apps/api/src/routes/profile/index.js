const profileService = require('../../services/profile.service');
const { z } = require('zod');

const profileUpdateSchema = z.object({
    fullName: z.string().min(2).optional(),
    bio: z.string().max(2000).optional(),
    location: z.string().max(255).optional(),
    skills: z.array(z.string().min(1)).optional()
});

module.exports = async function (fastify, opts) {
    const requireAuth = async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            return reply.status(401).send({ error: 'Authentication required' });
        }
    };

    // GET /profile
    fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
        try {
            return await profileService.getProfile(request.user.id);
        } catch (err) {
            reply.status(404).send({ error: err.message });
        }
    });

    // PUT /profile
    fastify.put('/', { preHandler: requireAuth }, async (request, reply) => {
        const data = profileUpdateSchema.parse(request.body || {});
        return await profileService.updateProfile(request.user.id, data);
    });

    // POST /profile/resume
    fastify.post('/resume', { preHandler: requireAuth }, async (request, reply) => {
        const data = await request.file();
        if (!data) return reply.status(400).send({ error: 'No file uploaded' });
        if (data.mimetype !== 'application/pdf') {
            return reply.status(400).send({ error: 'Only PDF files are allowed' });
        }

        // Convert stream to buffer
        const buffer = await data.toBuffer();

        try {
            return await profileService.uploadResume(request.user.id, { buffer });
        } catch (err) {
            reply.status(500).send({ error: err.message });
        }
    });
};
