
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput) {
    if (!data.selectedTime) {
      throw new Error('Selected time is required.');
    }

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        selectedDate: data.selectedDate,
        selectedTime: data.selectedTime,
        guestQuantity: data.guestQuantity,
        statusCheckout: data.statusCheckout,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
