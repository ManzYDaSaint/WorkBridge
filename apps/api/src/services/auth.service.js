const bcrypt = require('bcrypt');
const prisma = require('../prisma');

class AuthService {
    sanitizeUser(user) {
        if (!user) return null;
        const { password, ...safe } = user;
        return safe;
    }

    async register(data) {
        const { email, password, role, fullName, companyName, industry, location } = data;

        const hashedPassword = await bcrypt.hash(password, 10);

        return await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role,
                },
            });

            if (role === 'JOB_SEEKER') {
                await tx.jobSeeker.create({
                    data: {
                        userId: user.id,
                        fullName,
                        location,
                    },
                });
            } else if (role === 'EMPLOYER') {
                await tx.employer.create({
                    data: {
                        userId: user.id,
                        companyName,
                        industry,
                        location,
                        status: 'PENDING',
                    },
                });
            }

            const fullUser = await tx.user.findUnique({
                where: { id: user.id },
                include: { jobSeeker: true, employer: true },
            });

            return this.sanitizeUser(fullUser);
        });
    }

    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                jobSeeker: true,
                employer: true,
            },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        return this.sanitizeUser(user);
    }

    async loginById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { jobSeeker: true, employer: true }
        });
        return this.sanitizeUser(user);
    }

    async issueRefreshToken(userId) {
        const refreshToken = require('crypto').randomBytes(48).toString('hex');
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash, refreshTokenExpiresAt }
        });

        return { refreshToken, refreshTokenExpiresAt };
    }

    async verifyRefreshToken(userId, refreshToken) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) return false;
        if (user.refreshTokenExpiresAt < new Date()) return false;
        return await bcrypt.compare(refreshToken, user.refreshTokenHash);
    }

    async clearRefreshToken(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: null, refreshTokenExpiresAt: null }
        });
    }
}

module.exports = new AuthService();
