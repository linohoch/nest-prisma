import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "../constants";
import { Request } from "express";
import { Injectable, Logger } from "@nestjs/common";
import { UserService } from "../../user/user.service";
import { AuthService } from "../auth.service";
import { ContextIdFactory } from "@nestjs/core";

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  private readonly logger = new Logger(JwtRefreshTokenStrategy.name);

  constructor(
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtRefreshTokenStrategy.extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.refreshSecret,
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: any) {
    const {username} = await this.authService.validateRefreshToken(payload);
    if(username && payload.exp < Date.now() + (60 * 60 * 24) ){
      return  {username, reissueRefresh: true}
    }
      return {username, reissueRefresh: false}
  }

  private static extractJwtFromCookie(req: Request) {
    if (req.cookies && req.cookies['refresh_token']) {
      return req.cookies['refresh_token'];
    }
    return null;
  }

}