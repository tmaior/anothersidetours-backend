import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class GuideService {
  constructor(private prisma: PrismaService) {}

  async getAllGuides() {
    return this.prisma.guide.findMany();
  }

  async getGuideById(id: string) {
    return this.prisma.guide.findUnique({
      where: { id },
      include: { tours: true },
    });
  }

  async createGuide(data: { name: string; email: string; phone: string }) {
    return this.prisma.guide.create({ data });
  }

  async updateGuide(id: string, data: { name?: string; email?: string; phone?: string }) {
    return this.prisma.guide.update({ where: { id }, data });
  }

  async deleteGuide(id: string) {
    return this.prisma.guide.delete({ where: { id } });
  }

  async assignGuideToTour(guideId: string, tourId: string) {
    const tourExists = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tourExists) {
      throw new Error(`Tour with ID ${tourId} not found`);
    }

    return this.prisma.tour.update({
      where: { id: tourId },
      data: { guideId },
    });
  }

  async removeGuideFromTour(tourId: string) {
    const tourExists = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tourExists) {
      throw new Error(`Tour with ID ${tourId} not found`);
    }

    return this.prisma.tour.update({
      where: { id: tourId },
      data: { guideId: null },
    });
  }
}