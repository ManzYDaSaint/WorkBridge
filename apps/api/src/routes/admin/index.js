const prisma = require('../../prisma');
const notificationService = require('../../services/notification.service');
const auditService = require('../../services/audit.service');
const { z } = require('zod');

const statusSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED'])
});

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

const purgeSchema = z.object({
    days: z.number().int().min(1).max(3650)
});

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

module.exports = async function (fastify, opts) {
    // Middleware to check for Admin role
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            await request.jwtVerify();
            if (request.user.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Admin access required' });
            }
            await auditService.log(request.user.id, 'ADMIN_ACCESS', { path: request.url });
        } catch (err) {
            return reply.status(401).send({ error: 'Authentication required' });
        }
    });

    // Get all users
    fastify.get('/users', async (request, reply) => {
        const users = await prisma.user.findMany({
            include: {
                jobSeeker: { select: { fullName: true } },
                employer: { select: { companyName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return users;
    });

    // Get all employers (pending first)
    fastify.get('/employers', async (request, reply) => {
        const employers = await prisma.employer.findMany({
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return employers;
    });

    // Approve/Reject employer
    fastify.patch('/employers/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status } = statusSchema.parse(request.body); // APPROVED or REJECTED

        try {
            const updatedEmployer = await prisma.employer.update({
                where: { id },
                data: { status }
            });

            // Trigger notification
            await notificationService.notify(updatedEmployer.userId, {
                title: `Account ${status}`,
                message: status === 'APPROVED'
                    ? 'Congratulations! Your employer account has been approved. You can now post jobs.'
                    : 'Your employer account verification was not successful. Please check your details and try again.',
                type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR',
                email: true
            });

            // Log status update
            await auditService.log(request.user.id, `EMPLOYER_${status}`, { employerId: id });

            return updatedEmployer;
        } catch (err) {
            return reply.status(404).send({ error: 'Employer not found' });
        }
    });

    // GET /admin/audit-logs
    fastify.get('/audit-logs', async (request, reply) => {
        const query = auditQuerySchema.parse(request.query);
        const limit = Math.min(parseInt(query.limit || '50', 10), 200);
        const offset = parseInt(query.offset || '0', 10);

        const where = buildAuditWhere(query);

        const [items, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: { user: { select: { email: true, role: true } } },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.auditLog.count({ where })
        ]);

        return { items, total, limit, offset };
    });

    // GET /admin/audit-logs/export
    fastify.get('/audit-logs/export', async (request, reply) => {
        const query = auditQuerySchema.parse(request.query);
        const limit = Math.min(parseInt(query.limit || '1000', 10), 5000);
        const where = buildAuditWhere(query);
        const rows = await prisma.auditLog.findMany({
            where,
            include: { user: { select: { email: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const escape = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (/[",\n]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const header = ['createdAt', 'userEmail', 'userRole', 'action', 'method', 'path', 'statusCode', 'ip', 'userAgent', 'requestId'];
        const lines = [header.join(',')];
        for (const r of rows) {
            lines.push([
                r.createdAt.toISOString(),
                r.user?.email || 'ANONYMOUS',
                r.user?.role || '',
                r.action,
                r.method,
                r.path,
                r.statusCode,
                r.ip || '',
                r.userAgent || '',
                r.requestId || ''
            ].map(escape).join(','));
        }

        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        return lines.join('\n');
    });

    // POST /admin/audit-logs/purge
    fastify.post('/audit-logs/purge', async (request, reply) => {
        const { days } = purgeSchema.parse(request.body || {});
        const result = await auditService.purgeOlderThan(days);
        return { deleted: result.count, olderThanDays: days };
    });

    // Get platform metrics
    fastify.get('/metrics', async (request, reply) => {
        const [userCount, employerCount, seekerCount, jobCount, appCount] = await Promise.all([
            prisma.user.count(),
            prisma.employer.count(),
            prisma.jobSeeker.count(),
            prisma.job.count(),
            prisma.application.count()
        ]);

        return {
            totalUsers: userCount,
            totalEmployers: employerCount,
            totalJobSeekers: seekerCount,
            totalJobs: jobCount,
            totalApplications: appCount
        };
    });
};
