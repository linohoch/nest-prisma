import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "../constants";
import { Request} from "express";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh'){
  private readonly logger = new Logger(JwtRefreshTokenStrategy.name)
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtRefreshTokenStrategy.extractJwtFromCookie,
        // ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.refreshSecret,
      passReqToCallback: true
    });

  }
  validate(req: Request, payload: any) {
    this.logger.log(`refresh validate here ${payload.username}`)
    // const accessToken = req.get('Authorization').replace('Bearer ', '')
    return true
    //TODO token match
  }

  private static extractJwtFromCookie(req: Request){

    if(req.cookies && 'refresh_token' in req.cookies) {
      return req.cookies.refreshToken;
    }
    return null;
  }

}