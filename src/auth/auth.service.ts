import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { jwtConstants } from "./constants";
import { compare } from "bcrypt";
import { PrismaService } from "../prisma.service";
import { CacheService } from "../cache/cache.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private cacheService: CacheService
  ) {
  }

  async issueTokens(username: string, ip: string) {
    return {
      username: username,
      access_token: await this.issueAccessToken(username),
      refresh_token: this.issueRefreshToken(username, ip)
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
    const encryptedToken = await this.userService.getToken(userToken.username);
    if (!encryptedToken) {
      throw new HttpException("invalid token", HttpStatus.UNAUTHORIZED);
    }
    const isValid = true;
    //TODO 저장방식 변경
    if (isValid) {
      return userToken.username;
    }
    return null;
  }

  async issueAccessToken(username: string) {
    const token = this.jwtService.sign({ username: username }, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.exp,
      issuer: jwtConstants.iss
    });
    await this.cacheService.setCache(username, token, jwtConstants.exp);
    return token;
  }

  issueRefreshToken(username: string, ip: string) {
    const refreshToken = this.jwtService.sign({ username: username }, {
      secret: jwtConstants.refreshSecret,
      expiresIn: jwtConstants.refreshExp,
      issuer: jwtConstants.iss
    });
    const result = this.userService.storeToken(username, refreshToken, ip);//TODO
    if (result) {
      return refreshToken;
    }
    return null;
  }

  async deleteToken(username: string) {
    await this.cacheService.delCache(username);
    return this.userService.deleteTokens(username);
  }
}
