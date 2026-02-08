const prisma = require('../prisma');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';

async function getUserForNotify(userId) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/internal/users/${userId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getSeekerByUserId(userId) {
  try {
    const res = await fetch(`${PROFILE_SERVICE_URL}/internal/profiles/by-user/${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.jobSeeker;
  } catch {
    return null;
  }
}

class NotificationService {
  async notify(userId, { title, message, type = 'INFO', email = false, sms = false }) {
    const notification = await prisma.notification.create({
      data: { userId, title, message, type }
    });

    const user = await getUserForNotify(userId);
    const seeker = user ? await getSeekerByUserId(userId) : null;

    if (email && user?.email) {
      console.log(`[RESEND] Sending email to ${user.email}: ${title}`);
    }
    if (sms && user?.phone && seeker?.isSubscribed) {
      console.log(`[TWILIO] Sending SMS to ${user.phone}: ${message}`);
    }

    return notification;
  }

  async getNotifications(userId) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }
}

module.exports = new NotificationService();
