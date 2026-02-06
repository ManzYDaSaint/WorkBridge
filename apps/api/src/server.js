require('dotenv').config();
const fastifyFactory = require('fastify');
const auditService = require('./services/audit.service');
const path = require('path');
const autoload = require('@fastify/autoload');

const buildServer = (opts = {}) => {
    const fastify = fastifyFactory({ logger: true, ...opts });

    const isProduction = process.env.NODE_ENV === 'production';
    fastify.register(require('@fastify/helmet'), {
        contentSecurityPolicy: isProduction
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    baseUri: ["'self'"],
                    connectSrc: ["'self'", ...(process.env.CSP_CONNECT_SRC ? process.env.CSP_CONNECT_SRC.split(',') : [])],
                    imgSrc: ["'self'", "data:", "blob:"],
                    fontSrc: ["'self'", "data:"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    workerSrc: ["'self'", "blob:"],
                    manifestSrc: ["'self'"],
                    frameAncestors: ["'none'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: []
                }
            }
            : false
    });
    fastify.register(require('@fastify/cookie'));
    fastify.register(require('@fastify/cors'), {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true
    });

    fastify.register(require('@fastify/rate-limit'), {
        max: 100,
        timeWindow: '1 minute'
    });

    fastify.register(require('@fastify/jwt'), {
        secret: process.env.JWT_SECRET
    });

    fastify.register(require('@fastify/multipart'), {
        limits: { fileSize: 5 * 1024 * 1024 }
    });

    fastify.register(autoload, {
        dir: path.join(__dirname, 'plugins'),
    });

    fastify.register(autoload, {
        dir: path.join(__dirname, 'routes'),
    });

    fastify.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '0', 10);
    if (retentionDays > 0) {
        const runPurge = async () => {
            await auditService.purgeOlderThan(retentionDays);
        };
        runPurge().catch(() => {});
        const interval = setInterval(() => {
            runPurge().catch(() => {});
        }, 24 * 60 * 60 * 1000);
        if (interval.unref) interval.unref();
    }

    fastify.addHook('onResponse', async (request, reply) => {
        const userId = request.user?.id || null;
        const action = `${request.method} ${request.routerPath || request.raw.url}`;
        await auditService.log({
            userId,
            action,
            method: request.method,
            path: request.routerPath || request.raw.url,
            statusCode: reply.statusCode,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            requestId: request.id,
            meta: {
                params: request.params || {},
                query: request.query || {}
            }
        });
    });

    fastify.setErrorHandler((error, request, reply) => {
        if (error.name === 'ZodError') {
            return reply.status(400).send({ error: 'Invalid request', details: error.errors });
        }
        if (error.validation) {
            return reply.status(400).send({ error: 'Invalid request', details: error.validation });
        }
        request.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
    });

    return fastify;
};

module.exports = { buildServer };
