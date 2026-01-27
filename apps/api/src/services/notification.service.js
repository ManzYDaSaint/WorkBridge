const prisma = require('../prisma');
// Mocking external services for now. 
// In a real app, you'd use 'resend' and 'twilio' npm packages.

class NotificationService {
    async notify(userId, { title, message, type = 'INFO', email = false, sms = false }) {
        // 1. Create In-app Notification
        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
            },
        });

        // Fetch user details for multi-channel
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { jobSeeker: true },
        });

        // 2. Send Email via Resend (if requested and user has email)
        if (email && user.email) {
            this.sendEmail(user.email, title, message);
        }

        // 3. Send SMS via Twilio (if requested, user has phone, and seeker is subscribed)
        if (sms && user.phone && user.jobSeeker?.isSubscribed) {
            this.sendSMS(user.phone, message);
        }

        return notification;
    }

    async sendEmail(to, subject, text) {
        console.log(`[RESEND] Sending email to ${to}: ${subject}`);
        // await resend.emails.send({ from: 'WorkBridge <noreply@workbridge.me>', to, subject, text });
    }

    async sendSMS(to, message) {
        console.log(`[TWILIO] Sending SMS to ${to}: ${message}`);
        // await twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE, to });
    }

    async getNotifications(userId) {
        return await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    async markAsRead(notificationId, userId) {
        return await prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
}

module.exports = new NotificationService();
