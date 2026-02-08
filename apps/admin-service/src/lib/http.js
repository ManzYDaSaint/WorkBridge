const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';
const JOBS_SERVICE_URL = process.env.JOBS_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004';

async function callService(baseUrl, path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, opts);
  if (!res.ok) throw new Error(`Service error: ${res.status}`);
  return res.json();
}

async function callAuth(path) {
  return callService(AUTH_SERVICE_URL, path);
}

async function callProfile(path, opts = {}) {
  return callService(PROFILE_SERVICE_URL, path, opts);
}

async function callProfilePatch(path, body) {
  return callService(PROFILE_SERVICE_URL, path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function callJobs(path) {
  return callService(JOBS_SERVICE_URL, path);
}

async function callNotifications(path, body) {
  return callService(NOTIFICATIONS_SERVICE_URL, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

module.exports = { callAuth, callProfile, callProfilePatch, callJobs, callNotifications };
