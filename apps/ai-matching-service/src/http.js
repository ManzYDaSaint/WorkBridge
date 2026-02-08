const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';

async function callProfile(path) {
  const res = await fetch(`${PROFILE_SERVICE_URL}${path}`);
  if (!res.ok) return null;
  return res.json();
}

module.exports = { callProfile };
