import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmployeeService } from './employee.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private employeeService: EmployeeService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(employee.id, employee.email);

    await this.updateRefreshToken(employee.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
      }
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret-key',
      });

      const employee = await this.prisma.employee.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          refreshToken: true,
        },
      });

      if (!employee || !employee.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        employee.refreshToken
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access Denied');
      }

      const tokens = await this.generateTokens(employee.id, employee.email);
      await this.updateRefreshToken(employee.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(employeeId: string) {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { refreshToken: null },
    });
    return { message: 'Logout successful' };
  }
  
  async getProfile(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }
    
    return employee;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'jwt-secret-key',
      expiresIn: '15m',
    });
    
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret-key',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(employeeId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
} 