import { Router } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from './auth.service';
import { authenticate } from '../../common/guards/auth.guard';
import { asyncHandler } from '../../common/utils/async-handler';
import { validate } from '../../common/utils/validate';
import { z } from 'zod';

const router = Router();
const authService = new AuthService(PrismaService.getInstance());

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  organizationName: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
}));

router.post('/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.json({ success: true, data: result });
}));

router.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
  res.json({ success: true, message: 'Password changed successfully' });
}));

router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user!.userId);
  res.json({ success: true, data: profile });
}));

export default router;
