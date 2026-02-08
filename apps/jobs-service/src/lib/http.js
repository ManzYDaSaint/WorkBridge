const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3006';

async function callProfile(path) {
  const res = await fetch(`${PROFILE_SERVICE_URL}${path}`);
  if (!res.ok) return null;
  return res.json();
}

async function callNotifications(path, body) {
  await fetch(`${NOTIFICATIONS_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => {});
}

async function callAI(path, body) {
  const res = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) return null;
  return res.json();
}

module.exports = { callProfile, callNotifications, callAI };
