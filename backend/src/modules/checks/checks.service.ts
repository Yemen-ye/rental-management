import { PrismaClient, CheckStatus } from '@prisma/client';
import { BaseService } from '../../common/utils/crud';
import { NotFoundError } from '../../common/errors/app-error';

export class ChecksService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.check, 'Check');
  }

  async create(data: any, organizationId: string) {
    const lease = await this.prisma.lease.findUnique({ where: { id: data.leaseId } });
    if (!lease) throw new NotFoundError('Lease', data.leaseId);

    return super.create(data, organizationId, {
      include: { lease: { include: { tenant: true } }, payment: true },
    });
  }

  async deposit(checkId: string, organizationId: string) {
    await this.findById(checkId, organizationId);
    return this.prisma.check.update({
      where: { id: checkId },
      data: { status: CheckStatus.DEPOSITED },
      include: { lease: { include: { tenant: true } }, payment: true },
    });
  }

  async bounce(checkId: string, organizationId: string, notes?: string) {
    await this.findById(checkId, organizationId);
    return this.prisma.check.update({
      where: { id: checkId },
      data: { status: CheckStatus.BOUNCED, notes },
      include: { lease: { include: { tenant: true } }, payment: true },
    });
  }

  async clear(checkId: string, organizationId: string) {
    await this.findById(checkId, organizationId);
    return this.prisma.check.update({
      where: { id: checkId },
      data: { status: CheckStatus.CLEARED },
      include: { lease: { include: { tenant: true } }, payment: true },
    });
  }

  async getUpcomingMaturities(organizationId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.check.findMany({
      where: {
        organizationId,
        status: CheckStatus.PENDING,
        maturityDate: { gte: now, lte: futureDate },
      },
      include: { lease: { include: { tenant: true } }, payment: true },
      orderBy: { maturityDate: 'asc' },
    });
  }
}
