const { buildServer } = require('../server');

jest.setTimeout(20000);

describe('Health endpoint', () => {
    test('GET /health returns ok', async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
        const app = buildServer({ logger: false });
        const res = await app.inject({ method: 'GET', url: '/health' });
        expect(res.statusCode).toBe(200);
        const payload = res.json();
        expect(payload.status).toBe('ok');
        await app.close();
    });
});
