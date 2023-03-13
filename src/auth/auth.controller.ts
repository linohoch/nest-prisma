import { Controller, Get, Post, Request, Res, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './guard/jwt-access.guard';
import { Public } from '../public.decorator';
import { JwtRefreshGuard } from "./guard/jwt-refresh.guard";
import { response } from "express";
import { jwtConstants } from "./constants";

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  login(@Request() req) {
    const { refresh_token, ...result } = this.authService.issueTokens(req.user);
    req.res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: jwtConstants.refreshExp
    });
    return result;
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Get("refresh")
  async refreshToken(@Request() req) {
    if(req.user.reissueRefresh){
      return this.authService.issueTokens(req.user.username);
    }
    return { access_token: this.authService.issueAccessToken(req.user.username)}
  }
}
