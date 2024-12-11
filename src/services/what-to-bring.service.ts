import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class WhatToBringService {
  constructor(private prisma: PrismaService) {}

  async createWhatToBring(tourId: string, item: string) {
    return this.prisma.whatToBring.create({
      data: { tourId, item },
    });
  }

  async getWhatToBringByTour(tourId: string) {
    return this.prisma.whatToBring.findMany({
      where: { tourId },
    });
  }

  async updateWhatToBring(id: string, item: string) {
    return this.prisma.whatToBring.update({
      where: { id },
      data: { item },
    });
  }

  async deleteWhatToBring(id: string) {
    return this.prisma.whatToBring.delete({
      where: { id },
    });
  }
}
