import { Injectable } from '@nestjs/common';

import { Prisma, Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async createTenant(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return this.prisma.tenant.create({
      data,
    });
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany();
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  }

  async updateTenant(
    tenantId: string,
    data: Prisma.TenantUpdateInput,
  ): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    });
  }

  async deleteTenant(tenantId: string): Promise<Tenant> {
    return this.prisma.tenant.delete({
      where: { id: tenantId },
    });
  }
}
