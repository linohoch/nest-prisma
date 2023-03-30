import { Body, Controller, Delete, Get, Post, Put, Req, Request } from "@nestjs/common";
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { Public, Roles } from "../auth/custom.decorator";
import { Role } from "../auth/role.enum";

@Controller('/api/v1/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.userService.fetchAllUsers();
  }

  @Public()
  @Post("signup")
  async addUser(@Body() data: User): Promise<User> {
    return this.userService.createUser(data);
  }

  @Public()
  @Post("check")
  async findUser(@Body() data): Promise<boolean> {
    return !!await this.userService.findOne(data.email);
  }

  @Get("me")
  async findMe(@Request() req): Promise<any> {
    const { pw, ...userInfo } = await this.userService.findOne(req.user.username);
    return userInfo;
  }

  @Roles(Role.Admin)
  @Post('role')
  async grantRole(@Body() data): Promise<any> {
    return await this.userService.grantRoles(data.username, Role.Admin)
  }

  @Roles(Role.Admin)
  @Put('role')
  async retrieveRole(@Body() data): Promise<any> {
    return await this.userService.retrieveRole(data.username, Role.Admin)
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
