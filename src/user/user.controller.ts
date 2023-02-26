import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';

@Controller('/api/v1/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.userService.fetchAllUsers();
  }
  @Post()
  async addUser(@Body() data: User): Promise<User> {
    return this.userService.createUser(data);
  }
  @Put()
  async updateUser(@Body() data: User): Promise<User> {
    return this.userService.updateUser(data);
  }
  @Delete()
  async deleteUser(@Body() data: User): Promise<User> {
    return this.userService.updateUser(data);
  }
}
