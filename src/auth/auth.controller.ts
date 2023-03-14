import { Controller, Delete, Get, HttpStatus, Post, Request, Res, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from "./guard/local-auth.guard";
import { AuthService } from "./auth.service";
import { JwtAccessGuard } from "./guard/jwt-access.guard";
import { Public } from "./custom.decorator";
import { JwtRefreshGuard } from "./guard/jwt-refresh.guard";
import { response } from "express";
import { jwtConstants } from "./constants";
import { AuthGuard } from "@nestjs/passport";
import { UserService } from "../user/user.service";

@Controller("/api/v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService,
              private readonly userService: UserService) {
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Request() req) {
    const { username, roles } = req.user;
    const { refresh_token, ...result } = await this.authService.issueTokens(username, roles, req.ip);
    req.res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: jwtConstants.refreshExp,
      path: '/'
    });
    return result;
  }

  @UseGuards(AuthGuard("google"))
  @Get("google")
  async googleAuth(): Promise<void> {

  }

  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  async googleAuthCallback(@Request() req, @Res() res) {
    const { email, roles } = await this.authService.oAuthSign(req.user);
    const { refresh_token, ...result } = await this.authService.issueTokens(email, roles, req.ip);
    req.res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: jwtConstants.refreshExp
    });
    return result;
  }

  @UseGuards(AuthGuard("google"))
  @Get("google/link")
  async googleLink(@Request() req) {
    const user = await this.userService.updateUser(req.user);
    if (user) {
      return HttpStatus.OK;
    }
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Get("refresh")
  async refreshToken(@Request() req) {
    const { username, roles } = req.user;
    if (req.user.reissueRefresh) {
      const {refresh_token, ...token} = await this.authService.issueTokens(username, roles, req.ip);
      req.res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: jwtConstants.refreshExp
      });
      return token
    }
    return { access_token: await this.authService.issueAccessToken(username, roles) };
  }

  @Public()
  @UseGuards(JwtRefreshGuard) //TODO 만약 토큰 안넘어오면, 토큰 못지운다.
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
