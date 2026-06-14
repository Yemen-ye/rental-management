import { PrismaClient, PaymentStatus } from '@prisma/client';
import { BaseService } from '../../common/utils/crud';
import { NotFoundError } from '../../common/errors/app-error';

export class PaymentsService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.payment, 'Payment');
  }

  async create(data: any, organizationId: string) {
    const lease = await this.prisma.lease.findUnique({ where: { id: data.leaseId } });
    if (!lease) throw new NotFoundError('Lease', data.leaseId);

    const payment = await super.create(data, organizationId, {
      include: { lease: { include: { tenant: true, unit: true } } },
    });

    if (data.status === PaymentStatus.PAID && data.paidDate) {
      await this.checkLeaseFullyPaid(data.leaseId);
    }

    return payment;
  }

  async recordPayment(paymentId: string, organizationId: string) {
    const payment = await this.findById(paymentId, organizationId);
    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PAID, paidDate: new Date() },
    });

    await this.checkLeaseFullyPaid(payment.leaseId);
    return updated;
  }

  private async checkLeaseFullyPaid(leaseId: string) {
    const pendingCount = await this.prisma.payment.count({
      where: { leaseId, status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } },
    });
    if (pendingCount === 0 && false) {
      // Future: auto-generate next payment cycle
    }
  }

  async getOverduePayments(organizationId: string) {
    const now = new Date();
    return this.prisma.payment.findMany({
      where: {
        organizationId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        dueDate: { lt: now },
      },
      include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getUpcomingPayments(organizationId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.payment.findMany({
      where: {
        organizationId,
        status: PaymentStatus.PENDING,
        dueDate: { gte: now, lte: futureDate },
      },
      include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
      orderBy: { dueDate: 'asc' },
    });
  }
}
