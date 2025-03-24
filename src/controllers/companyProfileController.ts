import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyProfileService } from '../services/companyProfileService';

@Controller('company-profile')
export class CompanyProfileController {
  constructor(private readonly service: CompanyProfileService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body()
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
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    if (!data.tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.service.createCompanyProfile(data, logo);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('tenant/:tenantId')
  async findByTenant(@Param('tenantId') tenantId: string) {
    return this.service.getByTenant(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      companyName: string;
      phone: string;
      website: string;
      streetAddress: string;
      zipCode: string;
      city: string;
      state: string;
      country: string;
    }>,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.service.updateCompanyProfile(id, data, logo);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.deleteCompanyProfile(id);
  }

  @Delete('logo/:id')
  async deleteLogo(@Param('id') id: string) {
    return this.service.removeLogo(id);
  }
}