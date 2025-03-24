import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { S3Service } from './S3Service';

@Injectable()
export class CompanyProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service
  ) {}

  async createCompanyProfile(
    data: {
      tenantId: string;
      companyName: string;
      phone?: string;
      website?: string;
      streetAddress?: string;
      zipCode?: string;
      city?: string;
      state?: string;
      country?: string;
    },
    logo?: Express.Multer.File,
  ) {
    const { tenantId, ...profileData } = data;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    let logoUrl = null;
    if (logo) {
      logoUrl = await this.s3Service.uploadImage(logo);
    }
    
    return this.prisma.companyProfile.create({
      data: {
        ...profileData,
        logoUrl,
        tenant: {
          connect: { id: tenantId }
        }
      },
    });
  }

  async findAll() {
    return this.prisma.companyProfile.findMany();
  }

  async getByTenant(tenantId: string) {
    return this.prisma.companyProfile.findFirst({ where: { tenantId } });
  }

  async findOne(id: string) {
    return this.prisma.companyProfile.findUnique({ where: { id } });
  }

  async updateCompanyProfile(
    id: string,
    data: Partial<{
      companyName: string;
      phone: string;
      website: string;
      streetAddress: string;
      zipCode: string;
      city: string;
      state: string;
      country: string;
      tenantId: string;
    }>,
    logo?: Express.Multer.File,
  ) {
    const { tenantId, ...profileData } = data;
    
    const updateData: any = {
      ...profileData,
    };
    
    if (logo) {
      updateData.logoUrl = await this.s3Service.uploadImage(logo);
    }
    
    if (tenantId) {
      updateData.tenant = {
        connect: { id: tenantId }
      };
    }
    
    return this.prisma.companyProfile.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCompanyProfile(id: string) {
    return this.prisma.companyProfile.delete({ where: { id } });
  }

  async removeLogo(id: string) {
    return this.prisma.companyProfile.update({
      where: { id },
      data: { logoUrl: null },
    });
  }
}