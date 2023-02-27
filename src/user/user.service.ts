import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  // async encrypt(password) {
  //   const iv = randomBytes(16);
  //   const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
  //   const cipher = createCipheriv('aes-256-ctr', key, iv);
  //
  //   const textToEncrypt = 'Nest';
  //   return Buffer.concat([cipher.update(textToEncrypt), cipher.final()]);
  // }
  // async decrypt(encryptedText) {
  //   const decipher = createDecipheriv('aes-256-ctr', key, iv);
  //   return Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  // }

  async findOne(username: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id: String(username) },
    });
  }

  async fetchAllUsers(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  async createUser(data: User): Promise<User> {
    data.pw = await bcrypt.hash(data.pw, 10);
    const createdUser = await this.prismaService.user.create({
      data: data,
    });
    createdUser.pw = null;
    return createdUser;
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
