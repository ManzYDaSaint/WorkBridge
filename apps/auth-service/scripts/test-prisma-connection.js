const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:theSaint4real@localhost:3454/workbridge_auth_db?sslmode=disable',
        },
    },
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log('Connecting to Prisma...');
        await prisma.$connect();
        console.log('Connected!');
        const count = await prisma.user.count();
        console.log('User count:', count);
    } catch (e) {
        console.error('Prisma Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
