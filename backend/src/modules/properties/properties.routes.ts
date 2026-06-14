import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { PropertiesService } from './properties.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { parsePagination } from '../../common/utils/pagination';
import { validate } from '../../common/utils/validate';
import { z } from 'zod';

const router = Router();
const propertiesService = new PropertiesService(PrismaService.getInstance());

const createPropertySchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

const createUnitSchema = z.object({
  unitNumber: z.string().min(1).max(50),
  floor: z.number().int().optional(),
  bedrooms: z.number().int().default(0),
  bathrooms: z.number().int().default(0),
  areaSqm: z.number().optional(),
  rentAmount: z.number().default(0),
  securityDeposit: z.number().default(0),
  description: z.string().optional(),
});

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const params = parsePagination(req.query as any);
  const result = await propertiesService.findAll(req.user!.organizationId, params, {}, { include: { units: { include: { _count: { select: { leases: true } } } } } });
  res.json({ success: true, ...result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const property = await propertiesService.findById(id, req.user!.organizationId, { include: { units: true } });
  res.json({ success: true, data: property });
}));

router.post('/', validate(createPropertySchema), asyncHandler(async (req, res) => {
  const property = await propertiesService.create(req.body, req.user!.organizationId);
  res.status(201).json({ success: true, data: property });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const property = await propertiesService.update(id, req.body, req.user!.organizationId);
  res.json({ success: true, data: property });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await propertiesService.delete(id, req.user!.organizationId);
  res.json({ success: true, message: 'Property deleted' });
}));

router.get('/:id/units', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const units = await propertiesService.getUnits(id, req.user!.organizationId);
  res.json({ success: true, data: units });
}));

router.post('/:id/units', validate(createUnitSchema), asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const unit = await propertiesService.createUnit(id, req.body, req.user!.organizationId);
  res.status(201).json({ success: true, data: unit });
}));

router.put('/units/:unitId', asyncHandler(async (req, res) => {
  const unitId = req.params.unitId as string;
  const unit = await propertiesService.updateUnit(unitId, req.body, req.user!.organizationId);
  res.json({ success: true, data: unit });
}));

router.delete('/units/:unitId', asyncHandler(async (req, res) => {
  const unitId = req.params.unitId as string;
  await propertiesService.deleteUnit(unitId, req.user!.organizationId);
  res.json({ success: true, message: 'Unit deleted' });
}));

export default router;
