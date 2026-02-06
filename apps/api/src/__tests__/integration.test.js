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

describe('Integration flows', () => {
    const itOrSkip = hasDatabase ? it : it.skip;
    const testEmailPrefix = `test-int-${Date.now()}`;

    let app;
    let employerUser;
    let seekerUser;
    let adminUser;
    let job;
    let pendingEmployerUser;

    beforeAll(async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
        app = buildServer({ logger: false });
        if (!hasDatabase) return;
        dbReady = await canConnect();
        if (!dbReady) return;

        employerUser = await prisma.user.create({
            data: {
                email: `${testEmailPrefix}-employer@example.com`,
                password: 'hashed',
                role: 'EMPLOYER',
                employer: {
                    create: {
                        companyName: 'Test Co',
                        status: 'APPROVED'
                    }
                }
            },
            include: { employer: true }
        });

        seekerUser = await prisma.user.create({
            data: {
                email: `${testEmailPrefix}-seeker@example.com`,
                password: 'hashed',
                role: 'JOB_SEEKER',
                jobSeeker: {
                    create: {
                        fullName: 'Test Seeker',
                        skills: ['JS']
                    }
                }
            },
            include: { jobSeeker: true }
        });

        adminUser = await prisma.user.create({
            data: {
                email: `${testEmailPrefix}-admin@example.com`,
                password: 'hashed',
                role: 'ADMIN'
            }
        });

        job = await prisma.job.create({
            data: {
                employerId: employerUser.employer.id,
                title: 'Test Job',
                description: 'A test job description',
                skills: ['JS'],
                location: 'Lilongwe',
                type: 'full-time'
            }
        });

        pendingEmployerUser = await prisma.user.create({
            data: {
                email: `${testEmailPrefix}-pending-employer@example.com`,
                password: 'hashed',
                role: 'EMPLOYER',
                employer: {
                    create: {
                        companyName: 'Pending Co',
                        status: 'PENDING'
                    }
                }
            },
            include: { employer: true }
        });
    });

    afterAll(async () => {
        if (!hasDatabase || !dbReady) return;
        await prisma.application.deleteMany({
            where: { jobId: job?.id }
        });
        await prisma.notification.deleteMany({
            where: { userId: { in: [employerUser?.id, seekerUser?.id, adminUser?.id, pendingEmployerUser?.id].filter(Boolean) } }
        });
        await prisma.job.deleteMany({
            where: { employerId: employerUser?.employer?.id }
        });
        await prisma.employer.deleteMany({
            where: { userId: { in: [employerUser?.id, pendingEmployerUser?.id].filter(Boolean) } }
        });
        await prisma.jobSeeker.deleteMany({
            where: { userId: seekerUser?.id }
        });
        await prisma.user.deleteMany({
            where: { email: { startsWith: testEmailPrefix } }
        });
        await app.close();
        await prisma.$disconnect();
    });

    itOrSkip('GET /jobs is public', async () => {
        if (!dbReady) return;
        const res = await app.inject({ method: 'GET', url: '/jobs' });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(Array.isArray(payload)).toBe(true);
    });

    itOrSkip('Employer can create a job', async () => {
        if (!dbReady) return;
        const token = app.jwt.sign({ id: employerUser.id, role: 'EMPLOYER' });
        const res = await app.inject({
            method: 'POST',
            url: '/jobs',
            headers: { authorization: `Bearer ${token}` },
            payload: {
                title: 'New Job',
                description: 'Another test job description',
                skills: ['JS'],
                location: 'Blantyre',
                type: 'full-time'
            }
        });
        expect(res.statusCode).toBe(200);
    });

    itOrSkip('Unapproved employer cannot create a job', async () => {
        if (!dbReady) return;
        const token = app.jwt.sign({ id: pendingEmployerUser.id, role: 'EMPLOYER' });
        const res = await app.inject({
            method: 'POST',
            url: '/jobs',
            headers: { authorization: `Bearer ${token}` },
            payload: {
                title: 'Blocked Job',
                description: 'Should be blocked',
                skills: ['JS'],
                location: 'Blantyre',
                type: 'full-time'
            }
        });
        expect(res.statusCode).toBe(403);
    });

    itOrSkip('Seeker can apply and employer sees notification', async () => {
        if (!dbReady) return;
        const seekerToken = app.jwt.sign({ id: seekerUser.id, role: 'JOB_SEEKER' });
        const applyRes = await app.inject({
            method: 'POST',
            url: `/jobs/${job.id}/apply`,
            headers: { authorization: `Bearer ${seekerToken}` }
        });
        expect([200, 400]).toContain(applyRes.statusCode);

        const employerToken = app.jwt.sign({ id: employerUser.id, role: 'EMPLOYER' });
        const notifRes = await app.inject({
            method: 'GET',
            url: '/notifications',
            headers: { authorization: `Bearer ${employerToken}` }
        });
        expect(notifRes.statusCode).toBe(200);
        const payload = notifRes.json();
        expect(payload.length).toBeGreaterThan(0);
    });

    itOrSkip('Notifications can be marked as read', async () => {
        if (!dbReady) return;
        const employerToken = app.jwt.sign({ id: employerUser.id, role: 'EMPLOYER' });
        const notifRes = await app.inject({
            method: 'GET',
            url: '/notifications',
            headers: { authorization: `Bearer ${employerToken}` }
        });
        const notifications = notifRes.json();
        const target = notifications[0];
        const markRes = await app.inject({
            method: 'PATCH',
            url: `/notifications/${target.id}/read`,
            headers: { authorization: `Bearer ${employerToken}` }
        });
        expect(markRes.statusCode).toBe(200);
    });

    itOrSkip('Employer can update application status', async () => {
        if (!dbReady) return;
        let created = await prisma.application.findFirst({
            where: {
                jobId: job.id,
                seekerId: seekerUser.jobSeeker.id
            }
        });
        if (!created) {
            created = await prisma.application.create({
                data: {
                    jobId: job.id,
                    seekerId: seekerUser.jobSeeker.id
                }
            });
        }
        const employerToken = app.jwt.sign({ id: employerUser.id, role: 'EMPLOYER' });
        const res = await app.inject({
            method: 'PATCH',
            url: `/jobs/applications/${created.id}/status`,
            headers: { authorization: `Bearer ${employerToken}` },
            payload: { status: 'REVIEWED' }
        });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(payload.status).toBe('REVIEWED');
    });

    itOrSkip('Employer can view applicants', async () => {
        if (!dbReady) return;
        const employerToken = app.jwt.sign({ id: employerUser.id, role: 'EMPLOYER' });
        const res = await app.inject({
            method: 'GET',
            url: `/jobs/${job.id}/applicants`,
            headers: { authorization: `Bearer ${employerToken}` }
        });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(Array.isArray(payload)).toBe(true);
    });

    itOrSkip('Admin can approve employer', async () => {
        if (!dbReady) return;
        const adminToken = app.jwt.sign({ id: adminUser.id, role: 'ADMIN' });
        const res = await app.inject({
            method: 'PATCH',
            url: `/admin/employers/${pendingEmployerUser.employer.id}/status`,
            headers: { authorization: `Bearer ${adminToken}` },
            payload: { status: 'APPROVED' }
        });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(payload.status).toBe('APPROVED');
    });

    itOrSkip('Non-admin cannot access metrics', async () => {
        if (!dbReady) return;
        const token = app.jwt.sign({ id: seekerUser.id, role: 'JOB_SEEKER' });
        const res = await app.inject({
            method: 'GET',
            url: '/admin/metrics',
            headers: { authorization: `Bearer ${token}` }
        });
        expect(res.statusCode).toBe(403);
    });

    itOrSkip('Admin can fetch metrics', async () => {
        if (!dbReady) return;
        const adminToken = app.jwt.sign({ id: adminUser.id, role: 'ADMIN' });
        const res = await app.inject({
            method: 'GET',
            url: '/admin/metrics',
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(payload.totalUsers).toBeGreaterThan(0);
    });

    itOrSkip('Admin can view audit logs', async () => {
        if (!dbReady) return;
        const adminToken = app.jwt.sign({ id: adminUser.id, role: 'ADMIN' });
        const res = await app.inject({
            method: 'GET',
            url: '/admin/audit-logs?limit=10&offset=0',
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(Array.isArray(payload.items)).toBe(true);
    });

    itOrSkip('Admin can export audit logs CSV', async () => {
        if (!dbReady) return;
        const adminToken = app.jwt.sign({ id: adminUser.id, role: 'ADMIN' });
        const res = await app.inject({
            method: 'GET',
            url: '/admin/audit-logs/export?limit=5',
            headers: { authorization: `Bearer ${adminToken}` }
        });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
    });

    itOrSkip('Admin can purge audit logs', async () => {
        if (!dbReady) return;
        const adminToken = app.jwt.sign({ id: adminUser.id, role: 'ADMIN' });
        const res = await app.inject({
            method: 'POST',
            url: '/admin/audit-logs/purge',
            headers: { authorization: `Bearer ${adminToken}` },
            payload: { days: 3650 }
        });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(payload.olderThanDays).toBe(3650);
    });
});
