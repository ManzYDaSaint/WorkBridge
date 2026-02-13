require('dotenv').config();
const fastifyFactory = require('fastify');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const client = require('prom-client');

const buildServer = (opts = {}) => {
  const logDir = path.join(__dirname, '..', 'logs');
  // fs.mkdirSync(logDir, { recursive: true }); // Handled by pino transport


  const register = new client.Registry();
  client.collectDefaultMetrics({ register, prefix: 'notifications_service_' });
  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
  });
  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
  });

  const fastify = fastifyFactory({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino/file',
        options: { destination: path.join(logDir, 'notifications-service.log'), mkdir: true }
      }
    },
    ...opts
  });
  fastify.register(require('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  });
  fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET });
  fastify.register(require('./routes'), { prefix: '/notifications' });
  fastify.register(require('./routes/internal'), { prefix: '/internal' });

  fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return register.metrics();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const route = request.routeOptions?.url || request.url.split('?')[0];
    if (route === '/metrics') return done();
    const labels = {
      method: request.method,
      route,
      status_code: reply.statusCode
    };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, reply.getResponseTime() / 1000);
    return done();
  });
  fastify.setErrorHandler((err, req, reply) => {
    req.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error' });
  });
  return fastify;
};

module.exports = { buildServer };
