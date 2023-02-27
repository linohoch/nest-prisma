import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from '../public.decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    // return req.user;
    return this.authService.login(req.user);
  }
  // @UseGuards(JwtAuthGuard)
  @Public()
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
