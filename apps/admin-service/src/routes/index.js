const prisma = require('../prisma');
const auditService = require('../services/audit.service');
const { callAuth, callProfile, callProfilePatch, callJobs, callNotifications } = require('../lib/http');
const { z } = require('zod');

const statusSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });

const auditQuerySchema = z.object({
  limit: z.string().optional(),
  offset: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  method: z.string().optional(),
  path: z.string().optional(),
  statusCode: z.string().optional(),
  minStatus: z.string().optional(),
  maxStatus: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

const purgeSchema = z.object({ days: z.number().int().min(1).max(3650) });

const buildAuditWhere = (query) => {
  const where = {};
  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
  if (query.method) where.method = query.method.toUpperCase();
  if (query.path) where.path = { contains: query.path, mode: 'insensitive' };
  if (query.statusCode) where.statusCode = parseInt(query.statusCode, 10);
  if (query.minStatus || query.maxStatus) {
    where.statusCode = {
      ...(query.minStatus ? { gte: parseInt(query.minStatus, 10) } : {}),
      ...(query.maxStatus ? { lte: parseInt(query.maxStatus, 10) } : {})
    };
  }
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
};

const requireAdmin = async (request, reply) => {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'ADMIN') return reply.status(403).send({ error: 'Admin access required' });
    await auditService.log({
      userId: request.user.id,
      action: 'ADMIN_ACCESS',
      method: request.method,
      path: request.routerPath || request.raw.url,
      statusCode: 200,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.id,
      meta: { path: request.url }
    });
  } catch (err) {
    return reply.status(401).send({ error: 'Authentication required' });
  }
};

module.exports = async function (fastify) {
  fastify.addHook('preHandler', requireAdmin);

  fastify.get('/users', async () => {
    const [users, employers, seekers] = await Promise.all([
      callAuth('/internal/users'),
      callProfile('/internal/profiles/employers'),
      callProfile('/internal/profiles/seekers')
    ]);
    const userMap = {};
    users.forEach((u) => { userMap[u.id] = { ...u, jobSeeker: null, employer: null }; });
    (employers || []).forEach((e) => {
      if (userMap[e.userId]) userMap[e.userId].employer = { companyName: e.companyName };
    });
    (seekers || []).forEach((s) => {
      if (userMap[s.userId]) userMap[s.userId].jobSeeker = { fullName: s.fullName };
    });
    return Object.values(userMap);
  });

  fastify.get('/employers', async () => {
    const employers = await callProfile('/internal/profiles/employers');
    const users = await callAuth('/internal/users');
    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u; });
    return employers.map((e) => ({
      ...e,
      user: userMap[e.userId] ? { email: userMap[e.userId].email } : { email: '' }
    }));
  });

  fastify.patch('/employers/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status } = statusSchema.parse(request.body || {});

    const updated = await callProfilePatch(`/internal/profiles/employers/${id}/status`, { status });

    await callNotifications('/internal/notify', {
      userId: updated.userId,
      title: `Account ${status}`,
      message:
        status === 'APPROVED'
          ? 'Congratulations! Your employer account has been approved. You can now post jobs.'
          : 'Your employer account verification was not successful. Please check your details and try again.',
      type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
      email: true
    });

    await auditService.log({
      userId: request.user.id,
      action: `EMPLOYER_${status}`,
      method: 'PATCH',
      path: request.routerPath,
      statusCode: 200,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      meta: { employerId: id }
    });

    return updated;
  });

  fastify.get('/audit-logs', async (request, reply) => {
    const query = auditQuerySchema.parse(request.query || {});
    const limit = Math.min(parseInt(query.limit || '50', 10), 200);
    const offset = parseInt(query.offset || '0', 10);
    const where = buildAuditWhere(query);

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.auditLog.count({ where })
    ]);

    const userIds = [...new Set(items.map((i) => i.userId).filter(Boolean))];
    let userMap = {};
    if (userIds.length > 0) {
      const users = await callAuth('/internal/users');
      users.forEach((u) => { userMap[u.id] = u; });
    }

    const enriched = items.map((i) => ({
      ...i,
      user: i.userId && userMap[i.userId] ? { email: userMap[i.userId].email, role: userMap[i.userId].role } : null
    }));

    return { items: enriched, total, limit, offset };
  });

  fastify.get('/audit-logs/export', async (request, reply) => {
    const query = auditQuerySchema.parse(request.query || {});
    const limit = Math.min(parseInt(query.limit || '1000', 10), 5000);
    const where = buildAuditWhere(query);
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
    let userMap = {};
    if (userIds.length > 0) {
      const users = await callAuth('/internal/users');
      users.forEach((u) => { userMap[u.id] = u; });
    }

    const escape = (v) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = ['createdAt', 'userEmail', 'userRole', 'action', 'method', 'path', 'statusCode', 'ip', 'userAgent', 'requestId'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const u = r.userId && userMap[r.userId] ? userMap[r.userId] : null;
      lines.push(
        [
          r.createdAt.toISOString(),
          u?.email || 'ANONYMOUS',
          u?.role || '',
          r.action,
          r.method,
          r.path,
          r.statusCode,
          r.ip || '',
          r.userAgent || '',
          r.requestId || ''
        ]
          .map(escape)
          .join(',')
      );
    }

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    return lines.join('\n');
  });

  fastify.post('/audit-logs/purge', async (request, reply) => {
    const { days } = purgeSchema.parse(request.body || {});
    const result = await auditService.purgeOlderThan(days);
    return { deleted: result.count, olderThanDays: days };
  });

  fastify.get('/metrics', async () => {
    const [authStats, profileStats, jobsStats] = await Promise.all([
      callAuth('/internal/stats'),
      callProfile('/internal/profiles/stats'),
      callJobs('/internal/stats')
    ]);
    return {
      totalUsers: authStats.totalUsers || 0,
      totalEmployers: profileStats.totalEmployers || 0,
      totalJobSeekers: profileStats.totalJobSeekers || 0,
      totalJobs: jobsStats.totalJobs || 0,
      totalApplications: jobsStats.totalApplications || 0
    };
  });

  fastify.get('/health', async () => ({ status: 'ok', service: 'admin', timestamp: new Date().toISOString() }));
};
