const { buildServer } = require('./server');

const start = async () => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is required');
        }
        const port = process.env.PORT || 3000;
        const fastify = buildServer();
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
