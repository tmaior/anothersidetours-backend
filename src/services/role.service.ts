import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async createRole(name: string, description?: string) {
    return this.prisma.role.create({
      data: {
        name,
        description,
      },
    });
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async updateRole(id: string, data: { name?: string; description?: string }) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }

  async createPermission(code: string, description?: string) {
    return this.prisma.permission.create({
      data: {
        code,
        description,
      },
    });
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany();
  }

  async getPermissionById(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  async assignRoleToEmployee(employeeId: string, roleId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return this.prisma.employeeRole.create({
      data: {
        employeeId,
        roleId,
      },
    });
  }

  async removeRoleFromEmployee(employeeId: string, roleId: string) {
    return this.prisma.employeeRole.delete({
      where: {
        employeeId_roleId: {
          employeeId,
          roleId,
        },
      },
    });
  }

  async getEmployeeRoles(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        employeeRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return employee.employeeRoles.map(er => er.role);
  }

  async getEmployeePermissions(employeeId: string) {
    const roles = await this.getEmployeeRoles(employeeId);

    const permissionsSet = new Set();
    const permissions = [];
    
    roles.forEach(role => {
      role.rolePermissions.forEach(rp => {
        if (!permissionsSet.has(rp.permission.id)) {
          permissionsSet.add(rp.permission.id);
          permissions.push(rp.permission);
        }
      });
    });
    
    return permissions;
  }

  async hasPermission(employeeId: string, permissionCode: string) {
    const permissions = await this.getEmployeePermissions(employeeId);
    return permissions.some(p => p.code === permissionCode);
  }
} 