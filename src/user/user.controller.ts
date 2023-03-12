import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { Public } from '../public.decorator';

@Controller('/api/v1/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.userService.fetchAllUsers();
  }
  @Public()
  @Post('signup')
  async addUser(@Body() data: User): Promise<User> {
    return this.userService.createUser(data);
  }
  @Public()
  @Post('check')
  async findUser(@Body() data): Promise<boolean> {
     return !!await this.userService.findOne(data.email);

  }


  // @Put()
  // async updateUser(@Body() data: User): Promise<User> {
  //   return this.userService.updateUser(data);
  // }
  // @Delete()
  // async deleteUser(@Body() data: User): Promise<User> {
  //   return this.userService.updateUser(data);
  // }
}
