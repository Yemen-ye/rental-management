import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from './payments.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { parsePagination } from '../../common/utils/pagination';
import { validate } from '../../common/utils/validate';
import { z } from 'zod';

const router = Router();
const paymentsService = new PaymentsService(PrismaService.getInstance());

const createPaymentSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  lateFee: z.number().default(0),
});

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const params = parsePagination(req.query as any);
  const where: Record<string, unknown> = {};
  const status = req.query.status as string;
  const leaseId = req.query.leaseId as string;
  if (status) where.status = status;
  if (leaseId) where.leaseId = leaseId;
  const result = await paymentsService.findAll(req.user!.organizationId, params, where, {
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
  });
  res.json({ success: true, ...result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const payment = await paymentsService.findById(id, req.user!.organizationId, {
    include: { lease: { include: { tenant: true, unit: true } } },
  });
  res.json({ success: true, data: payment });
}));

router.post('/', validate(createPaymentSchema), asyncHandler(async (req, res) => {
  const payment = await paymentsService.create(req.body, req.user!.organizationId);
  res.status(201).json({ success: true, data: payment });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const payment = await paymentsService.update(id, req.body, req.user!.organizationId);
  res.json({ success: true, data: payment });
}));

router.post('/:id/record-payment', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const payment = await paymentsService.recordPayment(id, req.user!.organizationId);
  res.json({ success: true, data: payment });
}));

router.get('/overdue/list', asyncHandler(async (req, res) => {
  const payments = await paymentsService.getOverduePayments(req.user!.organizationId);
  res.json({ success: true, data: payments });
}));

router.get('/upcoming/list', asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const payments = await paymentsService.getUpcomingPayments(req.user!.organizationId, days);
  res.json({ success: true, data: payments });
}));

export default router;
