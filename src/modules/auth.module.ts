import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { EmployeeService } from '../services/employee.service';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { RoleService } from '../services/role.service';
import { RoleController } from '../controllers/role.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, RoleController],
  providers: [
    AuthService, 
    EmployeeService, 
    PrismaService, 
    RoleService, 
    JwtAuthGuard,
    Reflector
  ],
  exports: [AuthService, RoleService, JwtAuthGuard, Reflector],
})
export class AuthModule {}