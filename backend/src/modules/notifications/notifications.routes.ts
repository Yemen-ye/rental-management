import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { asyncHandler } from '../../common/utils/async-handler';

const router = Router();
const notificationsService = new NotificationsService(PrismaService.getInstance());

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const notifications = await notificationsService.getAll(req.user!.organizationId, req.user!.userId, limit);
  res.json({ success: true, data: notifications });
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await notificationsService.getUnreadCount(req.user!.organizationId, req.user!.userId);
  res.json({ success: true, data: { count } });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await notificationsService.markAsRead(id, req.user!.userId);
  res.json({ success: true, message: 'Notification marked as read' });
}));

export default router;
