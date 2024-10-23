import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { Prisma } from '@prisma/client';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @HttpCode(201)
  createTenant(@Body() data: Prisma.TenantCreateInput) {
    return this.tenantService.createTenant(data);
  }

  @Get()
  @HttpCode(200)
  getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Get(':id')
  @HttpCode(200)
  getTenant(@Param('id') tenantId: string) {
    return this.tenantService.getTenantById(tenantId);
  }

  @Put(':id')
  @HttpCode(200)
  updateTenant(
    @Param('id') tenantId: string,
    @Body() data: Prisma.TenantUpdateInput,
  ) {
    return this.tenantService.updateTenant(tenantId, data);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteTenant(@Param('id') tenantId: string) {
    return this.tenantService.deleteTenant(tenantId);
  }
}
