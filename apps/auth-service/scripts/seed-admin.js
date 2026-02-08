require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@workbridge.me';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists:', email);
    process.exit(0);
    return;
  }

  await prisma.user.create({
    data: { email, password: await bcrypt.hash(password, 10), role: 'ADMIN' }
  });
  console.log('Admin user created:', email);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
