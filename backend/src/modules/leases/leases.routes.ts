import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { LeasesService } from './leases.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { parsePagination } from '../../common/utils/pagination';
import { validate } from '../../common/utils/validate';
import { z } from 'zod';

const router = Router();
const leasesService = new LeasesService(PrismaService.getInstance());

const createLeaseSchema = z.object({
  unitId: z.string().uuid(),
  tenantId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentAmount: z.number().positive(),
  securityDeposit: z.number().default(0),
  paymentFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY']).default('MONTHLY'),
  paymentDay: z.number().int().min(1).max(31).default(1),
  noticePeriodDays: z.number().int().default(30),
  autoRenewal: z.boolean().default(false),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const params = parsePagination(req.query as any);
  const where: Record<string, unknown> = {};
  const status = req.query.status as string;
  const unitId = req.query.unitId as string;
  const tenantId = req.query.tenantId as string;
  if (status) where.status = status;
  if (unitId) where.unitId = unitId;
  if (tenantId) where.tenantId = tenantId;
  const result = await leasesService.findAll(req.user!.organizationId, params, where, {
    include: { unit: { include: { property: true } }, tenant: true },
  });
  res.json({ success: true, ...result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const lease = await leasesService.findById(id, req.user!.organizationId, {
    include: { unit: { include: { property: true } }, tenant: true, payments: true, checks: true },
  });
  res.json({ success: true, data: lease });
}));

router.post('/', validate(createLeaseSchema), asyncHandler(async (req, res) => {
  const lease = await leasesService.create(req.body, req.user!.organizationId);
  res.status(201).json({ success: true, data: lease });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const lease = await leasesService.update(id, req.body, req.user!.organizationId, {
    include: { unit: { include: { property: true } }, tenant: true },
  });
  res.json({ success: true, data: lease });
}));

router.post('/:id/renew', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { newEndDate, newRentAmount } = req.body;
  const lease = await leasesService.renew(id, new Date(newEndDate), newRentAmount, req.user!.organizationId);
  res.json({ success: true, data: lease });
}));

router.post('/:id/terminate', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const lease = await leasesService.terminate(id, req.user!.organizationId);
  res.json({ success: true, data: lease });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await leasesService.delete(id, req.user!.organizationId);
  res.json({ success: true, message: 'Lease deleted' });
}));

export default router;
