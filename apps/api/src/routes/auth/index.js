const authService = require('../../services/auth.service');
const { z } = require('zod');

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['JOB_SEEKER', 'EMPLOYER']),
    fullName: z.string().min(2).optional(),
    companyName: z.string().min(2).optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

module.exports = async function (fastify, opts) {
    fastify.post('/register', async (request, reply) => {
        try {
            const payload = registerSchema.parse(request.body);
            if (payload.role === 'JOB_SEEKER' && !payload.fullName) {
                return reply.status(400).send({ error: 'Full name is required for job seekers' });
            }
            if (payload.role === 'EMPLOYER' && !payload.companyName) {
                return reply.status(400).send({ error: 'Company name is required for employers' });
            }
            const user = await authService.register(payload);
            const token = fastify.jwt.sign({
                id: user.id,
                role: user.role
            }, { expiresIn: '15m' });
            const { refreshToken, refreshTokenExpiresAt } = await authService.issueRefreshToken(user.id);
            reply.setCookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/refresh',
                expires: refreshTokenExpiresAt
            });
            return { user, token };
        } catch (err) {
            if (err.code === 'P2002') {
                return reply.status(409).send({ error: 'Email already in use' });
            }
            return reply.status(400).send({ error: err.message });
        }
    });

    fastify.post('/login', async (request, reply) => {
        try {
            const payload = loginSchema.parse(request.body);
            const user = await authService.login(payload.email, payload.password);
            const token = fastify.jwt.sign({
                id: user.id,
                role: user.role
            }, { expiresIn: '15m' });
            const { refreshToken, refreshTokenExpiresAt } = await authService.issueRefreshToken(user.id);
            reply.setCookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/refresh',
                expires: refreshTokenExpiresAt
            });
            return { user, token };
        } catch (err) {
            reply.status(401).send({ error: 'Invalid credentials' });
        }
    });

    fastify.post('/refresh', async (request, reply) => {
        const refreshToken = request.cookies?.refreshToken;
        if (!refreshToken) return reply.status(401).send({ error: 'Refresh token missing' });

        try {
            const { userId } = request.body || {};
            if (!userId) return reply.status(400).send({ error: 'User id required' });
            const valid = await authService.verifyRefreshToken(userId, refreshToken);
            if (!valid) return reply.status(401).send({ error: 'Invalid refresh token' });

            const user = await authService.loginById(userId);
            if (!user) return reply.status(404).send({ error: 'User not found' });
            const token = fastify.jwt.sign({
                id: user.id,
                role: user.role
            }, { expiresIn: '15m' });
            return { user, token };
        } catch (err) {
            return reply.status(401).send({ error: 'Invalid refresh token' });
        }
    });

    fastify.post('/logout', async (request, reply) => {
        const refreshToken = request.cookies?.refreshToken;
        const { userId } = request.body || {};
        if (refreshToken && userId) {
            const valid = await authService.verifyRefreshToken(userId, refreshToken);
            if (valid) {
                await authService.clearRefreshToken(userId);
            }
        }
        reply.clearCookie('refreshToken', { path: '/refresh' });
        return { ok: true };
    });
};
