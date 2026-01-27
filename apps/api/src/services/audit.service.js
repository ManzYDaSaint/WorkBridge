const prisma = require('../prisma');

class AuditService {
    async log(userId, action, details = {}) {
        console.log(`[AUDIT] User: ${userId} | Action: ${action} | Details:`, details);
        // In a future phase, we would save this to an 'AuditLog' table
        // await prisma.auditLog.create({ data: { userId, action, details: JSON.stringify(details) } });
    }

    // Middleware factory
    createMiddleware(action) {
        return async (request, reply) => {
            await this.log(request.user?.id || 'ANONYMOUS', action, {
                method: request.method,
                url: request.url,
                ip: request.ip
            });
        };
    }
}

module.exports = new AuditService();
