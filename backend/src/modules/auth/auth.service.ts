import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { config } from '../../config';
import { JwtPayload } from '../../common/guards/auth.guard';
import { UnauthorizedError, ConflictError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationName?: string;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const organization = await this.prisma.organization.create({
      data: {
        name: data.organizationName || `${data.firstName}'s Organization`,
        slug: data.organizationName
          ? data.organizationName.toLowerCase().replace(/\s+/g, '-')
          : `org-${Date.now()}`,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: UserRole.ORG_ADMIN,
        organizationId: organization.id,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, organizationId: true },
    });

    logger.info(`User registered: ${user.email} (Org: ${organization.id})`);

    const tokens = this.generateTokens(user.id, organization.id, user.role);

    return { user, organization, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.prisma.loginHistory.create({
      data: { userId: user.id, success: true },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    const tokens = this.generateTokens(user.id, user.organizationId, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        settings: user.organization.settings,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, organizationId: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      return this.generateTokens(user.id, user.organizationId, user.role);
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatar: true, createdAt: true },
    });
  }

  private generateTokens(userId: string, organizationId: string, role: string) {
    const accessPayload: JwtPayload = { userId, organizationId, role, type: 'access' };
    const refreshPayload: JwtPayload = { userId, organizationId, role, type: 'refresh' };

    const accessToken = jwt.sign(accessPayload as object, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiration as any,
    });
    const refreshToken = jwt.sign(refreshPayload as object, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiration as any,
    });

    return { accessToken, refreshToken };
  }
}
