import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService
  ) {}

  async create(name: string, email: string, password: string, roleIds?: string[], phone?: string) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newEmployee = await this.prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        employeeRoles: roleIds && roleIds.length > 0 ? {
          create: roleIds.map(roleId => ({
            role: {
              connect: { id: roleId }
            }
          }))
        } : undefined
      },
      include: {
        employeeRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const { password: _, ...employeeWithoutPassword } = newEmployee;
    return employeeWithoutPassword;
  }

  async validateLogin(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (isPasswordValid) {
      return {
        message: 'Login successful',
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
        },
      };
    } else {
      throw new NotFoundException('Invalid credentials');
    }
  }

  async update(id: string, name: string, email: string, roleIds?: string[], phone?: string) {
    if (roleIds && roleIds.length >= 0) {
      await this.prisma.employeeRole.deleteMany({
        where: { employeeId: id }
      });
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: { 
        name, 
        email,
        phone,
        ...(roleIds && roleIds.length > 0 ? {
          employeeRoles: {
            create: roleIds.map(roleId => ({
              role: {
                connect: { id: roleId }
              }
            }))
          }
        } : {})
      },
      include: {
        employeeRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return updatedEmployee;
  }

  async updatePassword(id: string, currentPassword: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        password: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      employee.password,
    );

    if (!isPasswordValid) {
      throw new NotFoundException('Invalid credentials');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return updatedEmployee;
  }

  async getEmployee(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async deactivate(id: string) {
    const deactivatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: { 
        isActive: false
      },
      include: {
        employeeRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return deactivatedEmployee;
  }

  async getAllEmployee() {
    return this.prisma.employee.findMany({
      include: {
        employeeRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async resetPasswordByAdmin(userId: string, password: string) {
    if (!userId) {
      throw new NotFoundException('Employee ID is required');
    }

    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${userId} not found`);
    }

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      const updatedEmployee = await this.prisma.employee.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return { success: true, userId: updatedEmployee.id };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }
}
