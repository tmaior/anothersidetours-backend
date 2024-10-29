import { HttpException, HttpStatus } from '@nestjs/common';

export class TenantNotFoundException extends HttpException {
  constructor(tenantId: string) {
    super(`Tenant com o ID: ${tenantId} não encontrado`, HttpStatus.NOT_FOUND);
  }
}

export class TourNotFoundException extends HttpException {
  constructor(tourId: string) {
    super(`Tour com o ID: ${tourId} não encontrado`, HttpStatus.NOT_FOUND);
  }
}

export class TypeAddonNotValid extends HttpException {
  constructor(type : string) {
    super(`Tipo de add-on inválido: ${type}`, HttpStatus.BAD_REQUEST);
  }
}