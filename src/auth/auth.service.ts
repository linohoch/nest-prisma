import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "@prisma/client";
import { jwtConstants } from "./constants";
import { CacheService } from "../cache/cache.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private cacheService: CacheService,
    private config: ConfigService
  ) {
  }

  async issueTokens(username: string, roles: string[], ip: string) {
    return {
      username: username,
      access_token: await this.issueAccessToken(username, roles),
      refresh_token: this.issueRefreshToken(username, roles, ip)
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user: User = await this.userService.findOne(username);
    if (!user) {
      throw new NotFoundException("User not founded");
    }
    const isValid = await bcrypt.compare(password, user.pw);
    if (isValid) {
      const { pw, ...result } = user;
      return result;
    }
    return null;
  }

  async validateRefreshToken(userToken) {
    const { token } = await this.userService.getToken(userToken.username);
    if (!token) {
      this.logger.log(`refreshToken match failed`);
      throw new HttpException("invalid token", HttpStatus.UNAUTHORIZED);
    }
    const isValid = userToken.exp === token;
    if (!isValid) {
      this.logger.log(`refreshToken match failed`);
      throw new HttpException("invalid token", HttpStatus.UNAUTHORIZED);
    }
    return { username: userToken.username, roles: userToken.roles };
  }

  async issueAccessToken(username: string, roles: string[]) {
    const token = this.jwtService.sign({
      username: username,
      roles: roles
    }, {
      secret: this.config.get("secret"),
      expiresIn: jwtConstants.exp,
      issuer: jwtConstants.iss
    });
    await this.cacheService.setCache(username, token, jwtConstants.exp);
    return token;
  }

  issueRefreshToken(username: string, roles: string[], ip: string) {
    const refreshToken = this.jwtService.sign({
      username: username,
      roles: roles
    }, {
      secret: this.config.get('refreshSecret'),
      expiresIn: jwtConstants.refreshExp,
      issuer: jwtConstants.iss
    });
    const { exp } = this.jwtService.decode(refreshToken) as { [key: string]: any };
    const result = this.userService.storeToken(username, exp, ip);
    if (result) {
      return refreshToken;
    }
    return null;
  }

  async deleteToken(username: string) {
    await this.cacheService.delCache(username);
    return this.userService.deleteTokens(username);
  }

  async findGoogleUser(user: any) {
    const registered = await this.userService.findOne(user.email)
    if(!registered) {
      throw new HttpException('need signup first', HttpStatus.ACCEPTED)
    }
    if(registered.provider!=='google') {
      throw new HttpException( 'need link', HttpStatus.ACCEPTED)
    }
    return registered
  }


}
