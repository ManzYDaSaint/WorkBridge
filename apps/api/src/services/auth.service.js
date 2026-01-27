const bcrypt = require('bcrypt');
const prisma = require('../prisma');

class AuthService {
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

            return user;
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

        return user;
    }
}

module.exports = new AuthService();
