import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';

const router = Router();
const prisma = PrismaService.getInstance();

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const q = req.query.q as string;
  const orgId = req.user!.organizationId;

  if (!q || q.length < 2) {
    res.json({ success: true, data: { tenants: [], properties: [], leases: [] } });
    return;
  }

  const [tenants, properties, leases] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      take: 10,
    }),
    prisma.property.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { _count: { select: { units: true } } },
      take: 10,
    }),
    prisma.lease.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { tenant: { firstName: { contains: q, mode: 'insensitive' } } },
          { tenant: { lastName: { contains: q, mode: 'insensitive' } } },
          { tenant: { email: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { tenant: true, unit: { include: { property: true } } },
      take: 10,
    }),
  ]);

  res.json({ success: true, data: { tenants, properties, leases } });
}));

export default router;
