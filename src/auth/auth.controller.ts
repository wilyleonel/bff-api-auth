import { Body, Controller, Get, Post, Res, Req, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto.email, dto.password);

    res.cookie('access_token', tokens.AccessToken, {
      httpOnly: true,
      secure: false, // true en prod
      sameSite: 'strict',
      maxAge: (tokens.ExpiresIn as number) * 1000,
    });

    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const accessToken = req.cookies['access_token'];

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    return this.authService.me(accessToken);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { ok: true };
  }

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string; name: string }) {
    return await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name
    );
  }
}