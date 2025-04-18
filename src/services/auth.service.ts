import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmployeeService } from './employee.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { RoleService } from './role.service';

@Injectable()
export class AuthService {
  constructor(
    private employeeService: EmployeeService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private roleService: RoleService,
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

    const roles = await this.roleService.getEmployeeRoles(employee.id);
    const permissions = await this.roleService.getEmployeePermissions(employee.id);

    const tokens = await this.generateTokens(
      employee.id, 
      employee.email, 
      roles.map(r => r.name),
      permissions.map(p => p.code)
    );

    await this.updateRefreshToken(employee.id, tokens.refreshToken,);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        roles: roles.map(r => ({ id: r.id, name: r.name })),
        permissions: permissions.map(p => p.code)
      }
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET
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
        throw new UnauthorizedException('Access Denied - Invalid refresh token');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        employee.refreshToken
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access Denied - Token mismatch');
      }

      const roles = await this.roleService.getEmployeeRoles(employee.id);
      const permissions = await this.roleService.getEmployeePermissions(employee.id);

      const tokens = await this.generateTokens(
        employee.id, 
        employee.email, 
        roles.map(r => r.name),
        permissions.map(p => p.code)
      );

      await this.updateRefreshToken(employee.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      console.error('Refresh token error:', error.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(employeeId: string) {
    try {
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: { 
          refreshToken: null,
          refreshExpiresAt: null 
        },
      });
      return { message: 'Logout successful' };
    } catch (error) {
      console.error('Logout error:', error.message);
      throw new Error('Failed to logout');
    }
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

    const roles = await this.roleService.getEmployeeRoles(userId);
    const permissions = await this.roleService.getEmployeePermissions(userId);
    
    return {
      ...employee,
      roles: roles.map(r => ({ id: r.id, name: r.name })),
      permissions: permissions.map(p => p.code)
    };
  }

  private async generateTokens(
    userId: string, 
    email: string, 
    roles: string[], 
    permissions: string[]
  ) {
    const payload = { 
      sub: userId, 
      email,
      roles,
      permissions
    };
    
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(employeeId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const { exp } = this.jwtService.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(exp * 1000);


    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { refreshToken: hashedRefreshToken,
        refreshExpiresAt: expiresAt},
    });
  }
} 