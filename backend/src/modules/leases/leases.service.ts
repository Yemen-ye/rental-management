import { PrismaClient, LeaseStatus, UnitStatus } from '@prisma/client';
import { BaseService } from '../../common/utils/crud';
import { NotFoundError } from '../../common/errors/app-error';

export class LeasesService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.lease, 'Lease');
  }

  async create(data: any, organizationId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id: data.unitId } });
    if (!unit) throw new NotFoundError('Unit', data.unitId);

    const lease = await super.create(data, organizationId, {
      include: { unit: { include: { property: true } }, tenant: true },
    });

    await this.prisma.unit.update({
      where: { id: data.unitId },
      data: { status: UnitStatus.RENTED },
    });

    return lease;
  }

  async renew(leaseId: string, newEndDate: Date, newRentAmount?: number, organizationId?: string) {
    const lease = await this.findById(leaseId, organizationId!);

    const newLease = await this.prisma.lease.create({
      data: {
        organizationId: lease.organizationId,
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        startDate: lease.endDate,
        endDate: newEndDate,
        rentAmount: newRentAmount || lease.rentAmount,
        securityDeposit: lease.securityDeposit,
        paymentFrequency: lease.paymentFrequency,
        paymentDay: lease.paymentDay,
        noticePeriodDays: lease.noticePeriodDays,
        autoRenewal: lease.autoRenewal,
        terms: lease.terms,
        status: LeaseStatus.ACTIVE,
      },
      include: { unit: { include: { property: true } }, tenant: true },
    });

    await this.prisma.lease.update({
      where: { id: leaseId },
      data: { status: LeaseStatus.RENEWED },
    });

    return newLease;
  }

  async terminate(leaseId: string, organizationId: string) {
    const lease = await this.findById(leaseId, organizationId);

    const updated = await this.prisma.lease.update({
      where: { id: leaseId },
      data: { status: LeaseStatus.TERMINATED },
    });

    await this.prisma.unit.update({
      where: { id: lease.unitId },
      data: { status: UnitStatus.AVAILABLE },
    });

    return updated;
  }

  async getExpiringLeases(organizationId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return this.prisma.lease.findMany({
      where: {
        organizationId,
        status: LeaseStatus.ACTIVE,
        endDate: { gte: now, lte: futureDate },
      },
      include: { unit: { include: { property: true } }, tenant: true },
      orderBy: { endDate: 'asc' },
    });
  }

  async getDashboardStats(organizationId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      activeLeases,
      expiringLeases,
      totalProperties,
      totalUnits,
      rentedUnits,
      availableUnits,
    ] = await Promise.all([
      this.prisma.lease.count({ where: { organizationId, status: LeaseStatus.ACTIVE } }),
      this.prisma.lease.count({
        where: { organizationId, status: LeaseStatus.ACTIVE, endDate: { gte: now, lte: thirtyDaysFromNow } },
      }),
      this.prisma.property.count({ where: { organizationId } }),
      this.prisma.unit.count({ where: { property: { organizationId } } }),
      this.prisma.unit.count({ where: { property: { organizationId }, status: UnitStatus.RENTED } }),
      this.prisma.unit.count({ where: { property: { organizationId }, status: UnitStatus.AVAILABLE } }),
    ]);

    return { activeLeases, expiringLeases, totalProperties, totalUnits, rentedUnits, availableUnits };
  }
}
