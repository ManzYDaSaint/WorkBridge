const authService = require('../../services/auth.service');

module.exports = async function (fastify, opts) {
    fastify.post('/register', async (request, reply) => {
        try {
            const user = await authService.register(request.body);
            const token = fastify.jwt.sign({
                id: user.id,
                role: user.role
            });
            return { user, token };
        } catch (err) {
            reply.status(400).send({ error: err.message });
        }
    });

    fastify.post('/login', async (request, reply) => {
        try {
            const { email, password } = request.body;
            const user = await authService.login(email, password);
            const token = fastify.jwt.sign({
                id: user.id,
                role: user.role
            });
            return { user, token };
        } catch (err) {
            reply.status(401).send({ error: 'Invalid credentials' });
        }
    });
};
