import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { jwtConstants } from '../constants';
import { UserService } from "../../user/user.service";

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  private readonly logger = new Logger(JwtAccessTokenStrategy.name)
  constructor(
    private userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    this.logger.log(`access validate here`)
    const user = this.userService.findOne( payload.username );
    if(!user) {
      throw new UnauthorizedException();
    }
    return { username: payload.username };
  }
}
