import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { jwtConstants } from "./constants";
import { compare } from "bcrypt";
import { PrismaService } from "../prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  issueTokens(username) {
    return {
      username: username,
      access_token: this.issueAccessToken(username),
      refresh_token: this.issueRefreshToken(username)
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
    return userToken.username
    //TODO 매칭 수정
    //input : decoded jwt  ,   db: jwt

    // const encryptedToken = await this.userService.getToken(username);
    // if(!encryptedToken) {
    //   throw new UnauthorizedException();
    // }
    // const isValid = await bcrypt.compare(userToken, encryptedToken)
    // if(isValid) {
    //   return username
    // }
    // return null
  }

  issueAccessToken(username: string) {
    return this.jwtService.sign({ username: username }, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.exp,
        issuer: jwtConstants.iss
      })
  }

  issueRefreshToken(username: string) {
    const refreshToken = this.jwtService.sign({ username: username }, {
      secret: jwtConstants.refreshSecret,
      expiresIn: jwtConstants.refreshExp,
      issuer: jwtConstants.iss
    });
    const result = this.userService.addToken(username, refreshToken);
    if (result) {
      return refreshToken;
    }
    return null;
  }
}
