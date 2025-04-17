import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { EmployeeService } from '../services/employee.service';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'jwt-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmployeeService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {} 