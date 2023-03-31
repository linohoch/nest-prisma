import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { Injectable, Logger } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  private readonly logger = new Logger(JwtRefreshTokenStrategy.name);

  constructor(
    private authService: AuthService,
    private config: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtRefreshTokenStrategy.extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('refreshSecret'),
      passReqToCallback: true
    });
  }

  async validate(req: Request, payload: any) {
    const {username, roles} = await this.authService.validateRefreshToken(payload);
    if(username && payload.exp < Date.now() + (60 * 60 * 24) ){
      return  {username, roles, reissueRefresh: true}
    }
      return {username, roles, reissueRefresh: false}
  }

  private static extractJwtFromCookie(req: Request) {
    if (req.cookies && req.cookies['refresh_token']) {
      return req.cookies['refresh_token'];
    }
    return null;
  }

}