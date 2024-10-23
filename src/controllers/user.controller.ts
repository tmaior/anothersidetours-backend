import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode } from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body('tenantId') tenantId: string, @Body() data: Prisma.UserCreateInput) {
    return this.userService.createUser(tenantId, data);
  }

  @Get()
  getAllUsers(@Body('tenantId') tenantId: string) {
    return this.userService.getAllUsers(tenantId);
  }

  @Get(':id')
  getUserById(@Param('id') userId: string, @Body('tenantId') tenantId: string) {
    return this.userService.getUserById(userId, tenantId);
  }

  @Put(':id')
  updateUser(@Param('id') userId: string, @Body('tenantId') tenantId: string, @Body() data: Prisma.UserUpdateInput) {
    return this.userService.updateUser(userId, tenantId, data);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteUser(@Param('id') userId: string, @Body('tenantId') tenantId: string) {
    return this.userService.deleteUser(userId, tenantId);
  }
}
