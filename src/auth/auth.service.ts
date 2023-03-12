import { Injectable, NotFoundException } from "@nestjs/common";
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { jwtConstants } from "./constants";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(user: any) {
    const payload = { username: user.id };

    return {
      username: user.id,
      access_token: this.jwtService.sign(payload, {
        secret:jwtConstants.secret,
        expiresIn: '60s'
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret:jwtConstants.refreshSecret,
        expiresIn: '1h'
      })
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
  async reIssueAccessToken(username: string) {
    console.log('sssss');
    //TODO
    return
  }
}
