require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');
const autoload = require('@fastify/autoload');

// Register plugins
fastify.register(require('@fastify/cors'), {
    origin: '*', // For MVP development
});

fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute'
});

fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'superserioussecret',
});

// Autoload plugins & routes
fastify.register(autoload, {
    dir: path.join(__dirname, 'plugins'),
});

fastify.register(autoload, {
    dir: path.join(__dirname, 'routes'),
});

// Health check
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
    try {
        const port = process.env.PORT || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
