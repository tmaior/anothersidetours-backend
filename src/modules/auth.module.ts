import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { EmployeeService } from '../services/employee.service';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { RoleService } from '../services/role.service';
import { RoleController } from '../controllers/role.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, RoleController],
  providers: [AuthService, EmployeeService, PrismaService, RoleService],
  exports: [AuthService, RoleService],
})
export class AuthModule {}