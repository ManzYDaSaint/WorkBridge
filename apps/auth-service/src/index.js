const { buildServer } = require('./server');

const start = async () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  const port = process.env.PORT || 3001;
  const app = buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Auth Service listening on http://localhost:${port}`);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
