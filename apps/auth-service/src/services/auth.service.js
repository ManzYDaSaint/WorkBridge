const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../prisma');

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';

class AuthService {
  sanitizeUser(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }

  async callProfileService(path, method = 'GET', body = null) {
    const url = `${PROFILE_SERVICE_URL}${path}`;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `Profile service error: ${res.status}`);
    }
    return res.json();
  }

  async register(data) {
    const { email, password, role, fullName, companyName, industry, location } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role }
    });

    // Create profile in Profile service
    await this.callProfileService('/internal/profiles', 'POST', {
      userId: user.id,
      role,
      fullName,
      companyName,
      industry,
      location
    });

    const profile = await this.callProfileService(`/internal/profiles/by-user/${user.id}`);
    const fullUser = { ...user, ...profile };
    return this.sanitizeUser(fullUser);
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const profile = await this.callProfileService(`/internal/profiles/by-user/${user.id}`).catch(() => ({}));
    return this.sanitizeUser({ ...user, ...profile });
  }

  async loginById(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const profile = await this.callProfileService(`/internal/profiles/by-user/${userId}`).catch(() => ({}));
    return this.sanitizeUser({ ...user, ...profile });
  }

  async issueRefreshToken(userId) {
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash, refreshTokenExpiresAt }
    });
    return { refreshToken, refreshTokenExpiresAt };
  }

  async verifyRefreshToken(userId, refreshToken) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshTokenHash || !user?.refreshTokenExpiresAt) return false;
    if (user.refreshTokenExpiresAt < new Date()) return false;
    return bcrypt.compare(refreshToken, user.refreshTokenHash);
  }

  async clearRefreshToken(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null, refreshTokenExpiresAt: null }
    });
  }
}

module.exports = new AuthService();
