import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Req, Request } from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "@prisma/client";
import { Public, Roles } from "../auth/custom.decorator";
import { Role } from "../auth/role.enum";
import { BoardService } from "../board/board.service";

@Controller("/api/v1/user")
export class UserController {
  constructor(private userService: UserService,
              private boardService: BoardService) {
  }

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

  @Put("me")
  async updateUser(@Body() data: User): Promise<User> {
    return this.userService.updateUser(data);
  }

  @Public()
  @Get("/:user")
  async getUserInfo(
    @Request() req,
    @Param("user") user: string
  ): Promise<any> {
    return this.userService.selectUserInfoPublic(user);
  }

  // @Public()
  // @Get("/:user/history")
  // async getUserPostHist(
  //   @Request() req,
  //   @Param("user") user: string
  // ): Promise<any> {
  //   // const result = { articleRelation: "", commentRelation: "" };
  //   // result.articleRelation = await this.boardService.findAllArticleRelationByEmail(user);
  //   // result.commentRelation = await this.boardService.findAllCommentsRelationByEmail(user);
  //   return result;
  // }

  @Public()
  @Get("/:user/article")
  async getUserArticleHist(
    @Request() req,
    @Param("user") user: string | undefined,
    @Query("page") page: number | undefined,
    @Query("limit") limit: number | undefined,
    @Query("orderBy") orderBy: "date" | "like" | undefined,
    @Query("order") order: "desc" | "asc" | undefined,
  ): Promise<any> {
    if(user==='anonymous'){return HttpStatus.NO_CONTENT}
    return await this.boardService.findAllArticleRelationByEmail(user, page && page, orderBy, order, limit && limit);

  }

  @Public()
  @Get("/:user/comment")
  async getUserCommentHist(
    @Request() req,
    @Param("user") user: string,
    @Query("page") page: number
  ): Promise<any> {
    return await this.boardService.findAllCommentsRelationByEmail(user);
  }

  @Roles(Role.Admin)
  @Post("role")
  async grantRole(@Body() data): Promise<any> {
    return await this.userService.grantRoles(data.username, Role.Admin);
  }

  @Roles(Role.Admin)
  @Put("role")
  async retrieveRole(@Body() data): Promise<any> {
    return await this.userService.retrieveRole(data.username, Role.Admin);
  }


}
