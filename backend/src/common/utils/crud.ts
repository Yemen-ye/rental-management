import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError } from '../errors/app-error';
import { PaginationParams, paginate, PaginatedResult } from './pagination';

type PrismaModel = {
  findUnique: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any[]>;
  count: (args: any) => Promise<number>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

export class BaseService<T extends PrismaModel> {
  constructor(
    protected prisma: PrismaClient,
    protected model: T,
    protected entityName: string
  ) {}

  async findAll(
    organizationId: string,
    params: PaginationParams,
    additionalWhere: Record<string, unknown> = {},
    include?: Record<string, unknown>
  ): Promise<PaginatedResult<unknown>> {
    const where = { organizationId, ...additionalWhere };
    const skip = (params.page - 1) * params.limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
        include,
      }),
      this.model.count({ where }),
    ]);

    return paginate(data, total, params);
  }

  async findById(id: string, organizationId: string, include?: Record<string, unknown>) {
    const record = await this.model.findUnique({
      where: { id },
      include,
    });
    if (!record || record.organizationId !== organizationId) {
      throw new NotFoundError(this.entityName, id);
    }
    return record;
  }

  async create(data: Record<string, unknown>, organizationId: string, include?: Record<string, unknown>) {
    return this.model.create({
      data: { ...data, organizationId },
      include,
    });
  }

  async update(id: string, data: Record<string, unknown>, organizationId: string, include?: Record<string, unknown>) {
    await this.findById(id, organizationId);
    return this.model.update({
      where: { id },
      data,
      include,
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findById(id, organizationId);
    return this.model.delete({ where: { id } });
  }
}
