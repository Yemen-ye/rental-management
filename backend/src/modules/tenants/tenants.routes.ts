import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { BaseService } from '../../common/utils/crud';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { parsePagination } from '../../common/utils/pagination';
import { validate } from '../../common/utils/validate';
import { z } from 'zod';

const router = Router();
const tenantService = new BaseService(PrismaService.getInstance(), PrismaService.getInstance().tenant, 'Tenant');

const createTenantSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  nationality: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relation: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const params = parsePagination(req.query as any);
  const search = req.query.search as string | undefined;
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }
  const result = await tenantService.findAll(req.user!.organizationId, params, where, { include: { _count: { select: { leases: true } } } });
  res.json({ success: true, ...result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const tenant = await tenantService.findById(id, req.user!.organizationId, { include: { leases: { include: { unit: { include: { property: true } } } } } });
  res.json({ success: true, data: tenant });
}));

router.post('/', validate(createTenantSchema), asyncHandler(async (req, res) => {
  const tenant = await tenantService.create(req.body, req.user!.organizationId);
  res.status(201).json({ success: true, data: tenant });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const tenant = await tenantService.update(id, req.body, req.user!.organizationId);
  res.json({ success: true, data: tenant });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await tenantService.delete(id, req.user!.organizationId);
  res.json({ success: true, message: 'Tenant deleted' });
}));

export default router;
