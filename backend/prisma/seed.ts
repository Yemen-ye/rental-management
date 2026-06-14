import { PrismaClient, UserRole, PropertyType, UnitStatus, LeaseStatus, PaymentStatus, PaymentFrequency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const orgAdminPassword = await bcrypt.hash('Admin@123456', 12);

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Real Estate',
      slug: 'demo-org',
      email: 'info@demorealty.com',
      phone: '+966500000000',
      address: 'Riyadh, Saudi Arabia',
      subscriptionTier: 'professional',
    },
  });

  const admin = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      organizationId: organization.id,
      email: 'admin@demo.com',
      passwordHash: orgAdminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ORG_ADMIN,
      isActive: true,
    },
  });

  const property = await prisma.property.create({
    data: {
      organizationId: organization.id,
      name: 'Al-Malaz Tower',
      type: PropertyType.APARTMENT,
      address: 'Al-Malaz District',
      city: 'Riyadh',
      totalUnits: 10,
      status: 'AVAILABLE' as any,
    },
  });

  const units = [];
  for (let i = 1; i <= 5; i++) {
    const unit = await prisma.unit.create({
      data: {
        propertyId: property.id,
        unitNumber: `${i + 1}01`,
        floor: i,
        bedrooms: i === 1 ? 1 : i === 2 ? 2 : 3,
        bathrooms: i === 1 ? 1 : 2,
        areaSqm: 80 + i * 20,
        rentAmount: 30000 + i * 5000,
        securityDeposit: 5000,
        status: i <= 3 ? UnitStatus.RENTED : UnitStatus.AVAILABLE,
      },
    });
    units.push(unit);
  }

  const tenants = [];
  const tenantNames = ['Ahmed Ali', 'Sara Mohammed', 'Khalid Omar', 'Nora Hassan', 'Faisal Abdullah'];
  for (let i = 0; i < 3; i++) {
    const [firstName, lastName] = tenantNames[i].split(' ');
    const tenant = await prisma.tenant.create({
      data: {
        organizationId: organization.id,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        phone: `+9665${String(500000000 + i).slice(0, 9)}`,
        idType: 'National ID',
        idNumber: `1${String(Math.random()).slice(2, 11)}`,
        nationality: 'Saudi',
        isActive: true,
      },
    });
    tenants.push(tenant);
  }

  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - (6 - i * 2), 1);
    const endDate = new Date(now.getFullYear() + 1, now.getMonth() + (i === 0 ? 0 : 1), 1);

    const lease = await prisma.lease.create({
      data: {
        organizationId: organization.id,
        unitId: units[i].id,
        tenantId: tenants[i].id,
        startDate,
        endDate,
        rentAmount: units[i].rentAmount,
        securityDeposit: units[i].securityDeposit,
        paymentFrequency: PaymentFrequency.MONTHLY,
        paymentDay: 1,
        noticePeriodDays: 30,
        autoRenewal: false,
        status: LeaseStatus.ACTIVE,
        terms: 'Standard rental agreement terms apply.',
      },
    });

    for (let m = 0; m < 6; m++) {
      const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + m + 1, 1);
      const isPast = dueDate < now;
      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          leaseId: lease.id,
          amount: lease.rentAmount,
          dueDate,
          paidDate: isPast ? new Date(dueDate.getTime() + 86400000) : null,
          status: isPast ? PaymentStatus.PAID : PaymentStatus.PENDING,
          paymentMethod: isPast ? 'BANK_TRANSFER' as any : null,
        },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      organizationId: organization.id,
      userId: admin.id,
      action: 'CREATE' as any,
      entityType: 'ORGANIZATION' as any,
      description: 'System initialized with demo data',
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Admin login: admin@demo.com / Admin@123456`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
