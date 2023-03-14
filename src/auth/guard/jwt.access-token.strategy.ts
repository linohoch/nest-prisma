import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { jwtConstants } from '../constants';
import { UserService } from "../../user/user.service";
import { CacheService } from "../../cache/cache.service";

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  private readonly logger = new Logger(JwtAccessTokenStrategy.name)
  constructor(
    private userService: UserService,
    private cacheService: CacheService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret
    });
  }

  async validate(payload: any) {
    const cache = await this.cacheService.getCache(payload.username);
    // const user = await this.userService.findOne(payload.username);
    if (cache) {
      return { username: payload.username, roles: payload.roles };
    }
    throw new HttpException("invalid token", HttpStatus.UNAUTHORIZED);
  }
}
