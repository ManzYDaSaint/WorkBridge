const prisma = require('../prisma');

class AuditService {
    async log({ userId, action, method, path, statusCode, ip, userAgent, requestId, meta }) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    method,
                    path,
                    statusCode,
                    ip,
                    userAgent,
                    requestId,
                    meta
                }
            });
        } catch (err) {
            // Avoid breaking request flow if logging fails
            console.error('[AUDIT] Failed to log', err);
        }
    }

    async purgeOlderThan(days) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return prisma.auditLog.deleteMany({
            where: { createdAt: { lt: cutoff } }
        });
    }
}

module.exports = new AuditService();
