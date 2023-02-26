import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async fetchAllUsers(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  async createUser(data: User): Promise<User> {
    return this.prismaService.user.create({
      data: data,
    });
  }

  async updateUser(user: User): Promise<User> {
    return this.prismaService.user.update({
      data: { pw: user.pw },
      where: { no: user.no },
    });
  }

  async deleteUser(no: number): Promise<User> {
    return this.prismaService.user.delete({
      where: { no: no },
    });
  }
}
