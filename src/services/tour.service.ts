import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, Tour } from '@prisma/client';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import {
  TenantNotFoundException,
  TourNotFoundException,
} from '../exceptions/custom-exceptions';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class TourService {
  private s3: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async getTours(tenantId: string) {
    return this.prisma.tour.findMany({
      where: { tenantId },
      include: {
        addons: true,
      },
    });
  }

  async getAllTours(): Promise<Tour[]> {
    return this.prisma.tour.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        tenant: true,
        Category: true,
        addons: true,
      },
    });
  }

  async createTour(tenantId: string, data: Prisma.TourCreateInput) {
    const tenantExists = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenantExists) {
      throw new TenantNotFoundException(tenantId);
    }

    return this.prisma.tour.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        imageUrl: data.imageUrl,
        StandardOperation: data.StandardOperation,
        maxPerEventLimit: data.maxPerEventLimit,
        minPerEventLimit: data.minPerEventLimit,
        tenantId: tenantId,
      } as Prisma.TourUncheckedCreateInput,
    });
  }

  async getTourById(tenantId: string, id: string) {
    const tourExists = await this.prisma.tour.findFirst({
      where: { id, tenantId },
      include: {
        Guide: true,
        Category: true,
        addons: true,
      },
    });

    if (!tourExists) {
      throw new TourNotFoundException(id);
    }

    return tourExists;
  }

  async updateTour(
    tourId: string,
    data: Partial<{
      name: string;
      price: number;
      description?: string;
      duration?: number;
      categoryId?: string | null;
      isDeleted?: boolean;
    }>,
  ): Promise<Tour> {
    const tourExists = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tourExists) {
      throw new TourNotFoundException(tourId);
    }
    if (data.name && typeof data.name !== 'string') {
      throw new HttpException('Invalid name. It must be a string.', HttpStatus.BAD_REQUEST);
    }
    if (data.price && (typeof data.price !== 'number' || data.price <= 0)) {
      throw new HttpException('Invalid price. It must be a positive number.', HttpStatus.BAD_REQUEST);
    }
    if (data.duration && (typeof data.duration !== 'number' || data.duration <= 0)) {
      throw new HttpException('Invalid duration. It must be a positive number.', HttpStatus.BAD_REQUEST);
    }
    let categoryUpdate = {};
    if (data.categoryId === null) {
      categoryUpdate = { Category: { disconnect: true } };
    } else if (typeof data.categoryId === 'string') {
      const categoryExists = await this.prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!categoryExists) {
        throw new HttpException(`Category with id ${data.categoryId} not found.`, HttpStatus.BAD_REQUEST);
      }
      categoryUpdate = { Category: { connect: { id: data.categoryId } } };
    }
    const updatedData: Prisma.TourUpdateInput = {};
    if (data.name !== undefined) updatedData.name = data.name;
    if (data.price !== undefined) updatedData.price = data.price;
    if (data.description !== undefined) updatedData.description = data.description;
    if (data.duration !== undefined) updatedData.duration = data.duration;
    if (data.isDeleted !== undefined) updatedData.isDeleted = data.isDeleted;

    try {
      const updatedTour = await this.prisma.tour.update({
        where: { id: tourId },
        data: {
          ...updatedData,
          ...categoryUpdate,
        },
      });
      console.log('Updated Tour:', updatedTour);
      return updatedTour;
    } catch (error) {
      console.error(`Error updating Tour ${tourId}:`, error);
      throw new HttpException('Failed to update Tour.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTourWithCategoryAndBlackouts(tourId: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        Category: true,
      },
    });

    if (!tour) {
      throw new Error(`Tour with id ${tourId} not found.`);
    }

    const blackouts = await this.prisma.blackoutDate.findMany({
      where: {
        OR: [{ isGlobal: true }, { categoryId: tour.categoryId }],
      },
    });

    return { tour, blackouts };
  }

  async deleteTour(tourId: string) {
    const dependentReservations = await this.prisma.reservation.findMany({
      where: { tourId },
    });

    if (dependentReservations.length > 0) {
      throw new HttpException(
        `Cannot delete tour ${tourId} because it has associated reservations.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new Error('Tour not found');
    }

    if (tour.imageUrl) {
      const imageKey = tour.imageUrl.split('/').pop();
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: imageKey!,
          }),
        );
      } catch (error) {
        console.error(`Error deleting image from S3: ${error}`);
        throw new Error('Failed to delete the associated image');
      }
    }

    return this.prisma.tour.delete({
      where: { id: tourId },
    });
  }
}
