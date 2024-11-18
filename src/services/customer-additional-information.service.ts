import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Prisma } from '@prisma/client';


@Injectable()
export class CustomerAdditionalInformationService{
  constructor(private readonly  prisma: PrismaService) {}

  async findAllByReservation(reservationId: string) {
    return this.prisma.customerAdditionalInformation.findMany({
      where: { reservationId },
      include: { additionalInformation: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.customerAdditionalInformation.findUnique({
      where: { id },
      include: { additionalInformation: true, reservation: true },
    });
  }

  async create(data: Prisma.CustomerAdditionalInformationCreateInput) {
    return this.prisma.customerAdditionalInformation.create({
      data,
    });
  }

  async update(id: string, value: string) {
    return this.prisma.customerAdditionalInformation.update({
      where: { id },
      data: { value },
    });
  }

  async remove(id: string) {
    return this.prisma.customerAdditionalInformation.delete({
      where: { id },
    });
  }
}