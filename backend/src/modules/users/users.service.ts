import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BaseService } from '../../common/utils/crud';
import { ConflictError } from '../../common/errors/app-error';

export class UsersService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.user, 'User');
  }

  async create(data: any, organizationId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email, organizationId },
    });
    if (existing) throw new ConflictError('Email already exists in this organization');

    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 12)
      : await bcrypt.hash('default123', 12);

    return super.create(
      { ...data, passwordHash, role: data.role || 'AGENT' },
      organizationId,
      { select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, isActive: true, createdAt: true } }
    );
  }
}
