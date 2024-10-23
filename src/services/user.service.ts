import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/migrations/prisma.service';


@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(tenantId: string, data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
  }

  async getAllUsers(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { tenant_id: tenantId },
      include: {
        reservations: true,
      },
    });
  }

  async getUserById(userId: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, tenant_id: tenantId },
      include: {
        reservations: true,
      },
    });
  }

  async updateUser(userId: string, tenantId: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId, tenant_id: tenantId },
      data,
    });
  }

  async deleteUser(userId: string, tenantId: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id: userId, tenant_id: tenantId },
    });
  }
}
