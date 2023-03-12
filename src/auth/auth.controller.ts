import { Controller, Get, Post, Request, Res, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { Public } from '../public.decorator';
import { JwtRefreshGuard } from "./guard/jwt-refresh.guard";
import { response } from "express";
import { jwtConstants } from "./constants";

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    const {refresh_token, ...result} = await this.authService.login(req.user);
    req.res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: jwtConstants.refreshExp,
    })
    return result;
  }
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refreshToken(@Request() req) {
    return this.authService.reIssueAccessToken(req.user)
  }
}
