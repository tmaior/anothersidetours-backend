import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  
  constructor(
    private jwtService: JwtService,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const accessToken = this.extractTokenFromCookie(request, 'access_token');

    if (accessToken) {
      try {
        request['user'] = await this.jwtService.verifyAsync(accessToken, {
          secret: process.env.JWT_SECRET
        });
        return true;
      } catch (error) {
        this.logger.debug(`Access token verification failed: ${error.message}`);
        return this.handleTokenRefresh(request, response);
      }
    }

    return this.handleTokenRefresh(request, response);
  }

  private async handleTokenRefresh(request: Request, response: Response): Promise<boolean> {
    try {
      const refreshToken = this.extractTokenFromCookie(request, 'refresh_token');
      
      if (!refreshToken) {
        this.logger.debug('No refresh token found in cookies');
        throw new UnauthorizedException('No authentication tokens found');
      }

      const tokens = await this.authService.refreshTokens(refreshToken);
      
      if (!tokens) {
        this.logger.debug('Failed to obtain new tokens from refresh token');
        throw new UnauthorizedException('Failed to refresh tokens');
      }

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      };

      response.cookie('access_token', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      response.cookie('refresh_token', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      request['user'] = await this.jwtService.verifyAsync(tokens.accessToken, {
        secret: process.env.JWT_SECRET
      });

      return true;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);

      response.clearCookie('access_token');
      response.clearCookie('refresh_token');
      
      throw new UnauthorizedException('Authentication failed - Please login again');
    }
  }

  private extractTokenFromCookie(request: Request, cookieName: string): string | undefined {
    return request.cookies?.[cookieName];
  }
}