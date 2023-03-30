import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  Req, Delete, UseFilters, Put, Request, Query, Logger
} from "@nestjs/common";
import { BoardService } from './board.service';
import { Article, Photo, Comment, User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../config/multerOptions';
import { Public } from '../auth/custom.decorator';
import { HttpExceptionFilter } from "../filter/http-exception/http-exception.filter";

@Controller('/api/v1/board')
export class BoardController {
  private readonly logger = new Logger(BoardController.name)
  constructor(private boardService: BoardService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    // @UploadedFile(
    //   // new ParseFilePipe({
    //   //   validators: [new FileTypeValidator({ fileType: /\.(jpg|jpeg)$/ })],
    //   // }),
    // )
    @Body() body,
  ) {
    console.log(body);
  }

  @Public()
  @Get()
  async getAllArticles(): Promise<Article[]> {
    return this.boardService.fetchAllArticles();
  }
  @Public()
  @Get('/article/:articleNo/comment')
  async getAllComments(@Param('articleNo') no: number): Promise<Comment[]> {
    return this.boardService.fetchAllCommentsV2(no);
  }

  @Post('/article/:articleNo/comment')
  async addComment(@Req() req, @Body() comment: Comment): Promise<Comment> {
    console.log(req.user)
    return this.boardService.addComment(comment);
  }

  @Put("/article/:articleNo/like")
  async putLikeArticle(@Request() req,
                       @Param("articleNo") article: number,
                       @Query("put") put: string
  ): Promise<any> {
    this.logger.log("article ", put);
    if (put === "add") {
      return this.boardService.addLikeArticle(req.user.username, article);
    } else if (put === "sub") {
      return this.boardService.subLikeArticle(req.user.username, article);
    }
  }

  @Put("/article/:articleNo/comment/:commentNo/like")
  async putLikeComment(
    @Request() req,
    @Param("articleNo") article: number,
    @Param("commentNo") comment: number,
    @Query("put") put: string
  ): Promise<Comment> {
    this.logger.log("comment ", put);
    if (put === "add") {
      return this.boardService.addLikeComment(req.user.username, comment);
    } else if (put === "sub") {
      return this.boardService.subLikeComment(req.user.username, comment);
    }
  }

  @Public()
  @UseFilters(new HttpExceptionFilter())
  @Delete('/article/:articleNo/comment/:commentNo')
  async deleteComment(
    @Param('commentNo') comment: number,
    @Param('articleNo') article: number,
  ): Promise<Comment> {
    return this.boardService.deleteComment(comment);
  }

  @Public()
  @Get('/article/:articleNo')
  async getArticleDetail(@Param('articleNo') no, @Query('isRead') isRead): Promise<Article | Article[]> {
    if(isRead==='true'){
      return this.boardService.fetchArticleDetail(Number(no))
    } else {
      return this.boardService.fetchArticleDetailHit(Number(no));
    }
  }
  @Put('/article/:articleNo')
  async putArticle(@Request() req,
                   @Param('articleNo') no,
                   @Body() article: Article): Promise<Article> {
    return this.boardService.updateArticle(req.user.username, Number(no), article);
  }

  @Post('/article')
  async addArticle(@Request() req,
                   @Body() article: Article): Promise<any> {
    article.userEmail=req.user.username
    return this.boardService.addArticle(article);
  }

  @Delete('/article/:articleNo')
  async deleteArticle(@Param('articleNo') no): Promise<any> {
    return this.boardService.deleteArticle(Number(no))

  }

  @Get(':page')
  async getListByPage(@Param('page') page: number): Promise<any> {
    return this.boardService.fetchArticlesPage(page);
  }
}
