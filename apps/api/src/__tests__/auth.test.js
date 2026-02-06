const { buildServer } = require('../server');
const prisma = require('../prisma');

jest.setTimeout(20000);

const hasDatabase = Boolean(process.env.DATABASE_URL);
let dbReady = false;

const canConnect = async () => {
    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]);
        return true;
    } catch {
        return false;
    }
};

describe('Auth flows', () => {
    const itOrSkip = hasDatabase ? it : it.skip;

    beforeAll(async () => {
        if (!hasDatabase) return;
        dbReady = await canConnect();
    });

    itOrSkip('registers, logs in, and refreshes a job seeker', async () => {
        if (!dbReady) return;
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
        const app = buildServer({ logger: false });
        const email = `test-${Date.now()}@example.com`;

        const registerRes = await app.inject({
            method: 'POST',
            url: '/register',
            payload: {
                email,
                password: 'StrongPass123!',
                role: 'JOB_SEEKER',
                fullName: 'Test User'
            }
        });
        expect(registerRes.statusCode).toBe(200);
        const registerPayload = registerRes.json();
        expect(registerPayload.user.email).toBe(email);
        expect(registerPayload.user.password).toBeUndefined();

        const loginRes = await app.inject({
            method: 'POST',
            url: '/login',
            payload: { email, password: 'StrongPass123!' }
        });
        expect(loginRes.statusCode).toBe(200);
        const loginPayload = loginRes.json();
        expect(loginPayload.user.email).toBe(email);

        const setCookie = loginRes.headers['set-cookie'];
        const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
        expect(cookieHeader).toBeDefined();

        const refreshRes = await app.inject({
            method: 'POST',
            url: '/refresh',
            headers: { cookie: cookieHeader },
            payload: { userId: loginPayload.user.id }
        });
        expect(refreshRes.statusCode).toBe(200);
        const refreshPayload = refreshRes.json();
        expect(refreshPayload.user.email).toBe(email);
        await app.close();
    });
});
