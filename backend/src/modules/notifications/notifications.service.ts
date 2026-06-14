import { PrismaClient, NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { config } from '../../config';
import { logger } from '../../common/utils/logger';

export class NotificationsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    organizationId: string;
    userId?: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    return this.prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        type: data.type,
        channel: data.channel,
        title: data.title,
        body: data.body,
        data: (data.data || {}) as any,
        status: NotificationStatus.PENDING,
      },
    });
  }

  async send(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });
    if (!notification) throw new Error('Notification not found');

    try {
      switch (notification.channel) {
        case 'EMAIL':
          await this.sendEmail(notification);
          break;
        case 'SMS':
          await this.sendSms(notification);
          break;
        case 'PUSH':
          await this.sendPush(notification);
          break;
        case 'IN_APP':
          // Already stored in DB, just mark as sent
          break;
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch (error) {
      logger.error(`Failed to send notification ${notificationId}:`, error);
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED },
      });
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async getAll(organizationId: string, userId?: string, limit = 50) {
    const where: Record<string, unknown> = { organizationId };
    if (userId) where.userId = userId;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(organizationId: string, userId: string) {
    return this.prisma.notification.count({
      where: { organizationId, userId, status: NotificationStatus.SENT },
    });
  }

  async sendLeaseExpiryReminder(leaseId: string, daysRemaining: number) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: { tenant: true, organization: true },
    });
    if (!lease) return;

    const title = 'Lease Expiring Soon';
    const body = `Lease for ${lease.tenant.firstName} ${lease.tenant.lastName} expires in ${daysRemaining} days (${lease.endDate.toLocaleDateString()})`;

    await this.create({
      organizationId: lease.organizationId,
      type: NotificationType.LEASE_EXPIRING,
      channel: NotificationChannel.EMAIL,
      title,
      body,
      data: { leaseId, daysRemaining, endDate: lease.endDate.toISOString() },
    });
  }

  async sendPaymentReminder(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { lease: { include: { tenant: true } } },
    });
    if (!payment) return;

    const title = 'Payment Due Reminder';
    const body = `Payment of ${payment.amount} is due on ${payment.dueDate.toLocaleDateString()}`;

    await this.create({
      organizationId: payment.organizationId,
      type: NotificationType.PAYMENT_DUE,
      channel: NotificationChannel.EMAIL,
      title,
      body,
      data: { paymentId, amount: payment.amount.toString(), dueDate: payment.dueDate.toISOString() },
    });
  }

  async sendCheckMaturityReminder(checkId: string) {
    const check = await this.prisma.check.findUnique({
      where: { id: checkId },
      include: { lease: { include: { tenant: true } } },
    });
    if (!check) return;

    const title = 'Check Maturity Reminder';
    const body = `Check #${check.checkNumber} (${check.amount}) matures on ${check.maturityDate.toLocaleDateString()}`;

    await this.create({
      organizationId: check.organizationId,
      type: NotificationType.CHECK_MATURITY,
      channel: NotificationChannel.EMAIL,
      title,
      body,
      data: { checkId, checkNumber: check.checkNumber, amount: check.amount.toString(), maturityDate: check.maturityDate.toISOString() },
    });
  }

  private async sendEmail(notification: any) {
    // Integrate with nodemailer or SendGrid
    if (!config.email.user || !config.email.pass) {
      logger.info(`[EMAIL] Would send: ${notification.title} - ${notification.body}`);
      return;
    }
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });
  }

  private async sendSms(notification: any) {
    if (!config.sms.accountSid) {
      logger.info(`[SMS] Would send: ${notification.title} - ${notification.body}`);
      return;
    }
    // const client = twilio(config.sms.accountSid, config.sms.authToken);
    // await client.messages.create({ ... });
  }

  private async sendPush(notification: any) {
    if (!config.firebase.projectId) {
      logger.info(`[PUSH] Would send: ${notification.title} - ${notification.body}`);
      return;
    }
    // Firebase Admin SDK integration
  }
}
