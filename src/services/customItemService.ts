import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class CustomItemService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomItems(input: { 
    items: {
      tenantId: string;
      tourId: string;
      label: string;
      description: string;
      amount: number;
      quantity: number;
      reservationId: string;
    }[],
    reservationId: string
  }) {
    const itemsWithReservation = input.items.map(item => ({
      ...item,
      reservationId: input.reservationId
    }));

    return await this.prisma.customItem.createMany({
      data: itemsWithReservation,
    });
  }

  async findAll() {
    return await this.prisma.customItem.findMany();
  }

  async getCustomItemsByTenant(tenantId: string) {
    return await this.prisma.customItem.findMany({
      where: { tenantId },
    });
  }

  async getCustomItemsByTour(tourId: string) {
    return await this.prisma.customItem.findMany({
      where: { tourId },
    });
  }

  async getCustomItemsByReservation(reservationId: string) {
    return await this.prisma.customItem.findMany({
      where: { reservationId },
    });
  }

  async findOne(id: string) {
    return await this.prisma.customItem.findUnique({
      where: { id },
    });
  }

  async updateCustomItem(
    id: string,
    data: Partial<{
      label: string;
      description: string;
      amount: number;
      quantity: number;
    }>,
  ) {
    return await this.prisma.customItem.update({
      where: { id },
      data,
    });
  }

  async deleteCustomItem(id: string) {
    return await this.prisma.customItem.delete({
      where: { id },
    });
  }

  async deleteAllByReservation(reservationId: string) {
    try {
      const items = await this.prisma.customItem.findMany({
        where: { reservationId },
      });
      
      if (items.length === 0) {
        return { success: true, message: 'No custom items found for this reservation' };
      }
      return await this.prisma.customItem.deleteMany({
        where: { reservationId },
      });
    } catch (error) {
      console.error('Error deleting custom items:', error);
      return { success: false, error: error.message };
    }
  }

  async assignToTour(data: { tourId: string; customItemId: string }) {
    return await this.prisma.customItem.update({
      where: { id: data.customItemId },
      data: { tourId: data.tourId },
    });
  }

  async findCustomItemsByTourId(tourId: string) {
    return await this.prisma.customItem.findMany({
      where: { tourId },
    });
  }

  async assignCustomItemToTour(tourId: string, customItemId: string) {
    return await this.prisma.customItem.update({
      where: { id: customItemId },
      data: { tourId },
    });
  }

  async removeCustomItemFromTour(tourId: string, customItemId: string) {
    try {
      const exists = await this.prisma.customItem.findUnique({
        where: { id: customItemId },
      });

      if (!exists) {
        return { success: false, message: 'Custom item not found' };
      }

      return await this.prisma.customItem.update({
        where: { id: customItemId },
        data: { tourId: null },
      });
    } catch (error) {
      console.error('Error removing custom item from tour:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteCustomItemById(itemId: string) {
    try {
      const item = await this.prisma.customItem.findUnique({
        where: { id: itemId },
      });
      
      if (!item) {
        return { success: false, message: 'Custom item not found' };
      }
      return await this.prisma.customItem.delete({
        where: { id: itemId },
      });
    } catch (error) {
      console.error('Error deleting custom item:', error);
      return { success: false, error: error.message };
    }
  }
}
