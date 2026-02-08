require('dotenv').config();
const fastifyFactory = require('fastify');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const client = require('prom-client');
const { getUpstream, proxyRequest } = require('./proxy');

const buildServer = (opts = {}) => {
  const logDir = path.join(__dirname, '..', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logger = pino(
    { level: process.env.LOG_LEVEL || 'info' },
    pino.destination({ dest: path.join(logDir, 'api-gateway.log'), sync: false })
  );

  const register = new client.Registry();
  client.collectDefaultMetrics({ register, prefix: 'api_gateway_' });
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

  const fastify = fastifyFactory({ logger, ...opts });

  fastify.register(require('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  });

  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      done(null, body ? JSON.parse(body) : {});
    } catch (err) {
      done(err, undefined);
    }
  });

  fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return register.metrics();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const route = request.url.split('?')[0];
    if (route === '/metrics') return done();
    const labels = {
      method: request.method,
      route: request.routeOptions?.url || route,
      status_code: reply.statusCode
    };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, reply.getResponseTime() / 1000);
    return done();
  });

  fastify.all('/*', async (request, reply) => {
    const path = request.url.split('?')[0].replace(/^\//, '') || '';
    const target = getUpstream(`/${path}`, request.method);
    return proxyRequest(request, reply, target);
  });

  return fastify;
};

module.exports = { buildServer };
