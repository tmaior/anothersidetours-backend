import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const userId = request.user?.sub;

      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }

      const user = await this.prisma.employee.findUnique({
        where: { id: userId },
        include: {
          employeeRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const isAdmin = user.employeeRoles.some(
        (er) => er.role.name === 'ADMIN',
      );
      if (!isAdmin) {
        throw new UnauthorizedException('Admin privileges required');
      }
      return true;
    } catch (error) {
      console.error('AdminGuard error:', error);
      throw new UnauthorizedException('Error verifying admin privileges');
    }
  }
} 