import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { isNil } from '@nestjs/common/utils/shared.utils';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async findOne(username: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id: String(username) },
    });
  }

  async fetchAllUsers(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  async createUser(data: User): Promise<User> {
    const user = await this.findOne(data.id);
    console.log(isNil(user));
    if (user) {
      throw new HttpException(
        'invalid arg, already exist id',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      data.pw = await bcrypt.hash(data.pw, 10);
      const createdUser = await this.prismaService.user.create({
        data: data,
      });
      createdUser.pw = null;
      return createdUser;
    }
  }

  // async updateUser(user: User): Promise<User> {
  //   return this.prismaService.user.update({
  //     data: { pw: user.pw },
  //     where: { no: user.no },
  //   });
  // }
  //
  // async deleteUser(no: number): Promise<User> {
  //   return this.prismaService.user.delete({
  //     where: { no: no },
  //   });
  // }
}
