import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  return bcrypt.hash(password, salt);
}

async function seedPermissions() {
  const permissions = [
    { code: 'EMPLOYEE_CREATE', description: 'Allows creating employees' },
    { code: 'EMPLOYEE_READ', description: 'Allows reading employee data' },
    { code: 'EMPLOYEE_UPDATE', description: 'Allows updating employee data' },
    { code: 'EMPLOYEE_DELETE', description: 'Allows deleting employees' },

    { code: 'ROLE_CREATE', description: 'Allows creating roles' },
    { code: 'ROLE_READ', description: 'Allows reading role data' },
    { code: 'ROLE_UPDATE', description: 'Allows updating role data' },
    { code: 'ROLE_DELETE', description: 'Allows deleting roles' },

    { code: 'PERMISSION_CREATE', description: 'Allows creating permissions' },
    { code: 'PERMISSION_READ', description: 'Allows reading permission data' },

    { code: 'TOUR_CREATE', description: 'Allows creating tours' },
    { code: 'TOUR_READ', description: 'Allows reading tour data' },
    { code: 'TOUR_UPDATE', description: 'Allows updating tour data' },
    { code: 'TOUR_DELETE', description: 'Allows deleting tours' },

    { code: 'RESERVATION_CREATE', description: 'Allows creating reservations' },
    { code: 'RESERVATION_READ', description: 'Allows reading reservation data' },
    { code: 'RESERVATION_UPDATE', description: 'Allows updating reservation data' },
    { code: 'RESERVATION_DELETE', description: 'Allows deleting reservations' },

    { code: 'DASHBOARD_ACCESS', description: 'Allows access to dashboard' },

    { code: 'REPORT_ACCESS', description: 'Allows access to reports' },
    { code: 'REPORT_GENERATE', description: 'Allows generating reports' },
    
    { code: 'manage_guides', description: 'Allows managing guides' },
    { code: 'assign_guides', description: 'Allows assigning guides to reservations' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission,
    });
  }

  console.log('Permissions seeded successfully');
}

async function seedRoles() {
  const roles = [
    {
      name: 'ADMIN',
      description: 'Administrator with full access',
      permissions: [
        'EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
        'ROLE_CREATE', 'ROLE_READ', 'ROLE_UPDATE', 'ROLE_DELETE',
        'PERMISSION_CREATE', 'PERMISSION_READ',
        'TOUR_CREATE', 'TOUR_READ', 'TOUR_UPDATE', 'TOUR_DELETE',
        'RESERVATION_CREATE', 'RESERVATION_READ', 'RESERVATION_UPDATE', 'RESERVATION_DELETE',
        'DASHBOARD_ACCESS',
        'REPORT_ACCESS', 'REPORT_GENERATE',
        'manage_guides', 'assign_guides',
      ],
    },
    {
      name: 'MANAGER',
      description: 'Manager with most access',
      permissions: [
        'EMPLOYEE_READ',
        'ROLE_READ',
        'PERMISSION_READ',
        'TOUR_CREATE', 'TOUR_READ', 'TOUR_UPDATE',
        'RESERVATION_CREATE', 'RESERVATION_READ', 'RESERVATION_UPDATE',
        'DASHBOARD_ACCESS',
        'REPORT_ACCESS', 'REPORT_GENERATE',
        'manage_guides', 'assign_guides',
      ],
    },
    {
      name: 'GUIDE',
      description: 'Tour guide with limited access',
      permissions: [
        'DASHBOARD_ACCESS',
      ],
    },
  ];

  for (const roleData of roles) {
    const { name, description, permissions } = roleData;

    const role = await prisma.role.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });

    for (const permissionCode of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  console.log('Roles seeded successfully');
}

async function seedAdmin() {
  const adminEmail = 'admin@example.com';
  const adminPassword = await hashPassword('admin123');

  const admin = await prisma.employee.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      isActive: true,
    },
    create: {
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      isActive: true,
    },
  });

  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });
  
  if (adminRole) {
    await prisma.employeeRole.upsert({
      where: {
        employeeId_roleId: {
          employeeId: admin.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        employeeId: admin.id,
        roleId: adminRole.id,
      },
    });
  }
  
  console.log('Admin user seeded successfully');
}

async function seedGuideUser() {
  const guideEmail = 'guide@example.com';
  const guidePassword = await hashPassword('guide123');
  
  const guide = await prisma.employee.upsert({
    where: { email: guideEmail },
    update: {
      password: guidePassword,
      isActive: true,
    },
    create: {
      name: 'Guide User',
      email: guideEmail,
      password: guidePassword,
      isActive: true,
    },
  });
  
  const guideRole = await prisma.role.findUnique({
    where: { name: 'GUIDE' },
  });
  
  if (guideRole) {
    await prisma.employeeRole.upsert({
      where: {
        employeeId_roleId: {
          employeeId: guide.id,
          roleId: guideRole.id,
        },
      },
      update: {},
      create: {
        employeeId: guide.id,
        roleId: guideRole.id,
      },
    });
  }
  
  console.log('Guide user seeded successfully');
}

async function main() {
  try {
    await seedPermissions();
    await seedRoles();
    await seedAdmin();
    await seedGuideUser();
    
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 