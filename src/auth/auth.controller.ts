import { Controller, Delete, Get, HttpStatus, Logger, Post, Request, Res, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from "./guard/local-auth.guard";
import { AuthService } from "./auth.service";
import { JwtAccessGuard } from "./guard/jwt-access.guard";
import { Public } from "./custom.decorator";
import { JwtRefreshGuard } from "./guard/jwt-refresh.guard";
import { response } from "express";
import { jwtConstants } from "./constants";
import { AuthGuard } from "@nestjs/passport";
import { UserService } from "../user/user.service";
import { OAuth2Client } from "google-auth-library";
import { ConfigService } from "@nestjs/config";

@Controller("/api/v1/auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService,
              private readonly userService: UserService,
              private config: ConfigService) {
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
      maxAge: jwtConstants.refreshExp * 1000,
      path: '/',
      sameSite: 'none',
    });
    return result;
  }

  @Public()
  @Post("google/callback2")
  async googleAuthWithNoPassport(@Request() req) {
    const client_id = this.config.get<string>("google.clientId");
    const client = new OAuth2Client(client_id);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: client_id
    });
    const payload = ticket.getPayload()

    const { email, roles } = await this.authService.findGoogleUser(payload);
    const { refresh_token, ...result } = await this.authService.issueTokens(email, roles, req.ip);
    req.res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: jwtConstants.refreshExp * 1000,
      path: '/'
    });
    return result;
  }

  @Public()
  @Post("google/link")
  async googleLink(@Request() req) {
    const client_id = this.config.get<string>("google.clientId");
    const client = new OAuth2Client(client_id);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: client_id
    });
    const payload = ticket.getPayload()
    const google = payload.email

    const { email, roles } = await this.userService.updateUserProvider(google, 'google');
    const { refresh_token, ...result } = await this.authService.issueTokens(email, roles, req.ip);
    req.res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: jwtConstants.refreshExp * 1000,
      path: '/'
    });
    return result;
  }

  @Public()
  @UseGuards(AuthGuard("google"))
  @Get("google")
  async googleAuth(@Request() req): Promise<void> {
    //
  }
  @Public()
  @UseGuards(AuthGuard("google"))
  @Get("google/callback")
  async googleAuthCallback(@Request() req, @Res() res) {
    const { email, roles } = await this.authService.findGoogleUser(req.user);
    const { refresh_token, ...result } = await this.authService.issueTokens(email, roles, req.ip);
    req.res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: true,
      maxAge: jwtConstants.refreshExp * 1000
    });
    return result
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
        maxAge: jwtConstants.refreshExp * 1000
      });
      return token
    }
    // return { access_token: await this.authService.issueAccessToken(username, roles) };
    this.logger.log('refresh')
    return { username: username, access_token: await this.authService.issueAccessToken(username, roles) };

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
