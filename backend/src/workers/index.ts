import { PrismaClient, LeaseStatus, PaymentStatus, CheckStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../common/utils/logger';

const BATCH_SIZE = 50;

export function startBackgroundJobs() {
  logger.info('Background job scheduler started');

  checkExpiringLeases();
  checkOverduePayments();
  checkUpcomingCheckMaturities();

  setInterval(checkExpiringLeases, 60 * 60 * 1000);
  setInterval(checkOverduePayments, 60 * 60 * 1000);
  setInterval(checkUpcomingCheckMaturities, 60 * 60 * 1000);

  logger.info('All background jobs scheduled (every hour)');
}

async function checkExpiringLeases() {
  try {
    const prisma = PrismaService.getInstance();
    const notificationsService = new NotificationsService(prisma);

    const now = new Date();
    const [in30Days, in60Days, in90Days] = [
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    ];

    const leasePromises = [
      findLeasesExpiringBetween(prisma, now, in30Days),
      findLeasesExpiringBetween(prisma, in30Days, in60Days),
      findLeasesExpiringBetween(prisma, in60Days, in90Days),
    ];

    const [leases30, leases60, leases90] = await Promise.all(leasePromises);

    for (const lease of leases30) {
      await notificationsService.sendLeaseExpiryReminder(lease.id, 30);
    }
    for (const lease of leases60) {
      await notificationsService.sendLeaseExpiryReminder(lease.id, 60);
    }
    for (const lease of leases90) {
      await notificationsService.sendLeaseExpiryReminder(lease.id, 90);
    }

    if (leases30.length || leases60.length || leases90.length) {
      logger.info(`Sent ${leases30.length + leases60.length + leases90.length} lease expiry reminders`);
    }
  } catch (error) {
    logger.error('Error checking expiring leases:', error);
  }
}

async function findLeasesExpiringBetween(prisma: PrismaClient, start: Date, end: Date) {
  return prisma.lease.findMany({
    where: {
      status: LeaseStatus.ACTIVE,
      endDate: { gte: start, lte: end },
    },
    take: BATCH_SIZE,
  });
}

async function checkOverduePayments() {
  try {
    const prisma = PrismaService.getInstance();
    const notificationsService = new NotificationsService(prisma);
    const now = new Date();

    const overduePayments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: { lt: now },
      },
      take: BATCH_SIZE,
    });

    for (const payment of overduePayments) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.OVERDUE },
      });
      // Send notification for each overdue payment
      try {
        const notification = await notificationsService.create({
          organizationId: payment.organizationId,
          type: 'PAYMENT_OVERDUE' as any,
          channel: 'EMAIL' as any,
          title: 'Payment Overdue',
          body: `Payment of ${payment.amount} was due on ${payment.dueDate.toLocaleDateString()}. Please collect immediately.`,
          data: { paymentId: payment.id, amount: payment.amount.toString(), dueDate: payment.dueDate.toISOString() },
        });
        await notificationsService.send(notification.id);
      } catch {
        // Individual notification failure should not stop processing
      }
    }

    if (overduePayments.length) {
      logger.info(`Marked ${overduePayments.length} payments as overdue`);
    }
  } catch (error) {
    logger.error('Error checking overdue payments:', error);
  }
}

async function checkUpcomingCheckMaturities() {
  try {
    const prisma = PrismaService.getInstance();
    const notificationsService = new NotificationsService(prisma);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const maturingChecks = await prisma.check.findMany({
      where: {
        status: CheckStatus.PENDING,
        maturityDate: { gte: now, lte: sevenDaysFromNow },
      },
      take: BATCH_SIZE,
    });

    for (const check of maturingChecks) {
      await notificationsService.sendCheckMaturityReminder(check.id);
    }

    if (maturingChecks.length) {
      logger.info(`Sent ${maturingChecks.length} check maturity reminders`);
    }
  } catch (error) {
    logger.error('Error checking maturing checks:', error);
  }
}
