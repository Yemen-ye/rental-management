import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from './users.service';
import { authenticate } from '../../common/guards/auth.guard';
import { requireOrganization } from '../../common/guards/tenant.guard';
import { authorize } from '../../common/guards/roles.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { parsePagination, paginate } from '../../common/utils/pagination';
import { validate } from '../../common/utils/validate';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const router = Router();
const usersService = new UsersService(PrismaService.getInstance());

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100).optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

router.use(authenticate, requireOrganization);

router.get('/', asyncHandler(async (req, res) => {
  const params = parsePagination(req.query as any);
  const result = await usersService.findAll(req.user!.organizationId, params, {}, {
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  res.json({ success: true, ...result });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await usersService.findById(req.params.id as string, req.user!.organizationId);
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
}));

router.post('/', authorize(UserRole.ORG_ADMIN), validate(createUserSchema), asyncHandler(async (req, res) => {
  const user = await usersService.create(req.body, req.user!.organizationId);
  res.status(201).json({ success: true, data: user });
}));

router.put('/:id', authorize(UserRole.ORG_ADMIN), asyncHandler(async (req, res) => {
  const user = await usersService.update(req.params.id as string, req.body, req.user!.organizationId, {
    select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, isActive: true },
  });
  res.json({ success: true, data: user });
}));

router.delete('/:id', authorize(UserRole.ORG_ADMIN), asyncHandler(async (req, res) => {
  await usersService.delete(req.params.id as string, req.user!.organizationId);
  res.json({ success: true, message: 'User deleted' });
}));

export default router;
