import { Controller, Delete, Get, HttpStatus, Post, Request, Res, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './guard/jwt-access.guard';
import { Public } from '../public.decorator';
import { JwtRefreshGuard } from "./guard/jwt-refresh.guard";
import { response } from "express";
import { jwtConstants } from "./constants";

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Request() req) {
    const { refresh_token, ...result } = await this.authService.issueTokens(req.user, req.ip);
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
      return await this.authService.issueTokens(req.user.username, req.ip);
    }
    return { access_token: await this.authService.issueAccessToken(req.user.username)}
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Delete("logout")
  async logout(@Request() req) {
    await this.authService.deleteToken(req.user.username);
    await req.res.cookie("refresh_token", "", {
      httpOnly: true,
      secure: true,
      maxAge: 0
    });
    return HttpStatus.OK;
  }

}
