const viteEnv = typeof globalThis !== 'undefined' ? globalThis.__VITE_ENV__ : undefined;
const processEnv = typeof process !== 'undefined' ? process.env : undefined;

export const API_BASE_URL =
  (viteEnv && viteEnv.VITE_API_BASE_URL) ||
  (processEnv && processEnv.VITE_API_BASE_URL) ||
  'http://localhost:3000';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getToken = () => localStorage.getItem('token');

export const refreshSession = async () => {
  const user = getStoredUser();
  if (!user?.id) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId: user.id })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

export const apiFetch = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers || {});
      const newToken = getToken();
      if (newToken && !retryHeaders.has('Authorization')) {
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
      }
      return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: retryHeaders
      });
    }
  }

  return res;
};

export const apiFetchJson = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return apiFetch(path, { ...options, headers });
};
