import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode } from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() data: Prisma.UserCreateInput) {
    return this.userService.createUser(data);
  }

  @Get()
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  getUserById(@Param('id') userId: string) {
    return this.userService.getUserById(userId);
  }

  @Put(':id')
  updateUser(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    return this.userService.updateUser(id,data);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteUser(@Param('id') userId: string) {
    return this.userService.deleteUser(userId);
  }
}