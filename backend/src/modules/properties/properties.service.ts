import { PrismaClient } from '@prisma/client';
import { BaseService } from '../../common/utils/crud';

export class PropertiesService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.property, 'Property');
  }

  async getUnits(propertyId: string, organizationId: string) {
    await this.findById(propertyId, organizationId);
    return this.prisma.unit.findMany({
      where: { propertyId },
      orderBy: { unitNumber: 'asc' },
    });
  }

  async createUnit(propertyId: string, data: any, organizationId: string) {
    await this.findById(propertyId, organizationId);
    const unit = await this.prisma.unit.create({
      data: { ...data, propertyId },
    });
    await this.updateUnitCount(propertyId);
    return unit;
  }

  async updateUnit(unitId: string, data: any, organizationId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true },
    });
    if (!unit || unit.property.organizationId !== organizationId) {
      throw new Error('Unit not found');
    }
    return this.prisma.unit.update({
      where: { id: unitId },
      data,
    });
  }

  async deleteUnit(unitId: string, organizationId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true },
    });
    if (!unit || unit.property.organizationId !== organizationId) {
      throw new Error('Unit not found');
    }
    await this.prisma.unit.delete({ where: { id: unitId } });
    await this.updateUnitCount(unit.propertyId);
  }

  private async updateUnitCount(propertyId: string) {
    const count = await this.prisma.unit.count({ where: { propertyId } });
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { totalUnits: count },
    });
  }
}
