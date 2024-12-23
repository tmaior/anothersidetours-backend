import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode, HttpException, HttpStatus,
  Param,
  Post,
  Put, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantService } from '../services/tenant.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../services/S3Service';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createTenant(
    @Body() data: Prisma.TenantCreateInput,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;
    try {
      if (file) {
        imageUrl = await this.s3Service.uploadImage(file);
      }
      return await this.tenantService.createTenant(data, imageUrl);
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new HttpException('Failed to upload image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
