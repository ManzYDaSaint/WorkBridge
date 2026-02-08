const { buildServer } = require('./server');

const start = async () => {
  const port = process.env.PORT || 3000;
  const app = buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API Gateway listening on http://localhost:${port}`);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
