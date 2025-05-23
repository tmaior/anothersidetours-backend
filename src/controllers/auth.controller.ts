import { BadRequestException, Body, Controller, Get, Post, Res, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body, @Res({ passthrough: true }) response: Response) {
    try {
      const { email, password } = body;
      const result = await this.authService.login(email, password);

      this.setCookies(response, result.accessToken, result.refreshToken);

      return { 
        message: 'Login successful',
        employee: result.employee 
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const refreshToken = request.cookies?.refresh_token;
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not provided');
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      this.setCookies(response, tokens.accessToken, tokens.refreshToken);

      return { message: 'Tokens refreshed successfully' };
    } catch (error) {
      throw new UnauthorizedException('Failed to refresh tokens');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const user = request['user'];
      await this.authService.logout(user.sub);

      response.clearCookie('access_token');
      response.clearCookie('refresh_token');
      
      return { message: 'Logout successful' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() request: Request) {
    const userId = request['user'].sub;
    return this.authService.getProfile(userId);
  }

  private setCookies(response: Response, accessToken: string, refreshToken: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    response.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
} 