import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(user: any) {
    const payload = { username: user.id };
    return {
      loginUsername: user.id,
      access_token: this.jwtService.sign(payload),
    };
  }
  async validateUser(username: string, password: string): Promise<any> {
    const user: User = await this.userService.findOne(username);
    const isValid = await bcrypt.compare(password, user.pw);
    if (isValid) {
      const { pw, ...result } = user;
      return result;
    }
    return null;
  }
}
