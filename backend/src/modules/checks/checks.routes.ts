import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { ChecksService } from './checks.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { parsePagination } from '../../common/utils/pagination';
import { validate } from '../../common/utils/validate';
import { z } from 'zod';

const router = Router();
const checksService = new ChecksService(PrismaService.getInstance());

const createCheckSchema = z.object({
  leaseId: z.string().uuid(),
  paymentId: z.string().uuid(),
  checkNumber: z.string().min(1),
  bankName: z.string().min(1),
  amount: z.number().positive(),
  issueDate: z.coerce.date(),
  maturityDate: z.coerce.date(),
  notes: z.string().optional(),
});

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const params = parsePagination(req.query as any);
  const where: Record<string, unknown> = {};
  const status = req.query.status as string;
  const leaseId = req.query.leaseId as string;
  if (status) where.status = status;
  if (leaseId) where.leaseId = leaseId;
  const result = await checksService.findAll(req.user!.organizationId, params, where, {
    include: { lease: { include: { tenant: true } } },
  });
  res.json({ success: true, ...result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const check = await checksService.findById(id, req.user!.organizationId, {
    include: { lease: { include: { tenant: true } }, payment: true },
  });
  res.json({ success: true, data: check });
}));

router.post('/', validate(createCheckSchema), asyncHandler(async (req, res) => {
  const check = await checksService.create(req.body, req.user!.organizationId);
  res.status(201).json({ success: true, data: check });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const check = await checksService.update(id, req.body, req.user!.organizationId);
  res.json({ success: true, data: check });
}));

router.post('/:id/deposit', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const check = await checksService.deposit(id, req.user!.organizationId);
  res.json({ success: true, data: check });
}));

router.post('/:id/bounce', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const check = await checksService.bounce(id, req.user!.organizationId, req.body.notes);
  res.json({ success: true, data: check });
}));

router.post('/:id/clear', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const check = await checksService.clear(id, req.user!.organizationId);
  res.json({ success: true, data: check });
}));

router.get('/upcoming/list', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const checks = await checksService.getUpcomingMaturities(req.user!.organizationId, days);
  res.json({ success: true, data: checks });
}));

export default router;
