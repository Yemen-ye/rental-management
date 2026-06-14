import { Router } from 'express';
import { PrismaClient, LeaseStatus, PaymentStatus, CheckStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';

const router = Router();
const prisma = PrismaService.getInstance();

router.use(authenticate, requireOrganization);

router.get('/summary', asyncHandler(async (req, res) => {
  const orgId = req.user!.organizationId;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalProperties,
    totalUnits,
    rentedUnits,
    availableUnits,
    activeLeases,
    totalTenants,
    expiringLeases,
    overduePayments,
    pendingChecks,
    totalRevenue,
  ] = await Promise.all([
    prisma.property.count({ where: { organizationId: orgId } }),
    prisma.unit.count({ where: { property: { organizationId: orgId } } }),
    prisma.unit.count({ where: { property: { organizationId: orgId }, status: 'RENTED' } }),
    prisma.unit.count({ where: { property: { organizationId: orgId }, status: 'AVAILABLE' } }),
    prisma.lease.count({ where: { organizationId: orgId, status: LeaseStatus.ACTIVE } }),
    prisma.tenant.count({ where: { organizationId: orgId, isActive: true } }),
    prisma.lease.count({
      where: { organizationId: orgId, status: LeaseStatus.ACTIVE, endDate: { gte: now, lte: thirtyDaysFromNow } },
    }),
    prisma.payment.count({
      where: { organizationId: orgId, status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] }, dueDate: { lt: now } },
    }),
    prisma.check.count({
      where: { organizationId: orgId, status: CheckStatus.PENDING },
    }),
    prisma.payment.aggregate({
      where: { organizationId: orgId, status: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      properties: { total: totalProperties },
      units: { total: totalUnits, rented: rentedUnits, available: availableUnits, occupancyRate: totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0 },
      leases: { active: activeLeases, expiringSoon: expiringLeases },
      tenants: { total: totalTenants },
      payments: { overdue: overduePayments },
      checks: { pending: pendingChecks },
      revenue: { total: totalRevenue._sum.amount || 0 },
    },
  });
}));

router.get('/upcoming-payments', asyncHandler(async (req, res) => {
  const orgId = req.user!.organizationId;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const payments = await prisma.payment.findMany({
    where: { organizationId: orgId, status: PaymentStatus.PENDING, dueDate: { gte: now, lte: thirtyDaysFromNow } },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });
  res.json({ success: true, data: payments });
}));

router.get('/expiring-leases', asyncHandler(async (req, res) => {
  const orgId = req.user!.organizationId;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const leases = await prisma.lease.findMany({
    where: { organizationId: orgId, status: LeaseStatus.ACTIVE, endDate: { gte: now, lte: thirtyDaysFromNow } },
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { endDate: 'asc' },
    take: 10,
  });
  res.json({ success: true, data: leases });
}));

router.get('/overdue-payments', asyncHandler(async (req, res) => {
  const orgId = req.user!.organizationId;
  const now = new Date();
  const payments = await prisma.payment.findMany({
    where: { organizationId: orgId, status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] }, dueDate: { lt: now } },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });
  res.json({ success: true, data: payments });
}));

router.get('/recent-activities', asyncHandler(async (req, res) => {
  const orgId = req.user!.organizationId;
  const logs = await prisma.activityLog.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json({ success: true, data: logs });
}));

export default router;
