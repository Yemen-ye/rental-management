import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { BaseService } from '../../common/utils/crud';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { parsePagination } from '../../common/utils/pagination';

const router = Router();
const prisma = PrismaService.getInstance();
const logService = new BaseService(prisma, prisma.activityLog, 'ActivityLog');

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const params = parsePagination(req.query as any);
  const where: Record<string, unknown> = {};
  const entityType = req.query.entityType as string;
  const action = req.query.action as string;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  const result = await logService.findAll(req.user!.organizationId, params, where, {
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  });
  res.json({ success: true, ...result });
}));

export default router;
