import { HttpException, HttpStatus } from '@nestjs/common';

export class TenantNotFoundException extends HttpException {
  constructor(tenantId: string) {
    super(`Tenant with ID: ${tenantId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class TourNotFoundException extends HttpException {
  constructor(tourId: string) {
    super(`Tour with ID: ${tourId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class TypeAddonNotValid extends HttpException {
  constructor(type: string) {
    super(`Invalid add-on type: ${type}`, HttpStatus.BAD_REQUEST);
  }
}
