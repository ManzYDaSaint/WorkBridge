const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PROFILE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
const JOBS_URL = process.env.JOBS_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004';
const ADMIN_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3005';
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:3006';

const TARGETS = {
  auth: AUTH_URL,
  profile: PROFILE_URL,
  jobs: JOBS_URL,
  notifications: NOTIFICATIONS_URL,
  admin: ADMIN_URL,
  ai: AI_URL
};

function getUpstream(url, method) {
  const path = url.replace(/^\//, '') || '';
  if (path === 'login' || path === 'register' || path === 'refresh' || path === 'logout') return { base: TARGETS.auth, path: `/${path}` };
  if (path.startsWith('profile')) return { base: TARGETS.profile, path: `/${path}` };
  if (path === 'notifications/toggle-subscription') return { base: TARGETS.profile, path: '/profile/subscription' };
  if (path.startsWith('notifications')) return { base: TARGETS.notifications, path: `/${path}` };
  if (path.startsWith('jobs')) return { base: TARGETS.jobs, path: `/${path}` };
  if (path.startsWith('admin')) return { base: TARGETS.admin, path: `/${path}` };
  if (path.startsWith('ai')) return { base: TARGETS.ai, path: `/${path}` };
  if (path === 'health') return null;
  return { base: TARGETS.auth, path: `/${path}` };
}

async function proxyRequest(request, reply, target) {
  if (!target) {
    return reply.send({ status: 'ok', gateway: true, timestamp: new Date().toISOString() });
  }

  const url = `${target.base}${target.path}${request.raw.url?.includes('?') ? request.raw.url.slice(request.raw.url.indexOf('?')) : ''}`;
  const headers = { ...request.headers };
  delete headers.host;

  const opts = {
    method: request.method,
    headers,
    credentials: 'omit'
  };
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const ct = (headers['content-type'] || '').toLowerCase();
    if (ct.includes('multipart/form-data')) {
      opts.body = request.raw;
      opts.duplex = 'half';
    } else if (request.body !== undefined) {
      opts.body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    }
  }

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    const responseHeaders = {};
    res.headers.forEach((v, k) => {
      const lower = k.toLowerCase();
      if (['content-type', 'content-length', 'set-cookie'].includes(lower)) {
        responseHeaders[k] = v;
      }
    });
    Object.entries(responseHeaders).forEach(([k, v]) => reply.header(k, v));
    reply.status(res.status);
    try {
      const json = JSON.parse(text);
      return reply.send(json);
    } catch {
      return reply.send(text);
    }
  } catch (err) {
    request.log.error(err);
    return reply.status(502).send({ error: 'Bad Gateway', message: err.message });
  }
}

module.exports = { getUpstream, proxyRequest };
