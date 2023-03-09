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
  Req, Delete, UseFilters
} from "@nestjs/common";
import { BoardService } from './board.service';
import { Article, Photo, Comment, User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../config/multerOptions';
import { Public } from '../public.decorator';
import { HttpExceptionFilter } from "../filter/http-exception/http-exception.filter";

@Controller('/api/v1/board')
export class BoardController {
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
    return this.boardService.fetchAllComments(no);
  }
  @Public()
  @Post('/article/:articleNo/comment')
  async addComment(@Body() comment: Comment): Promise<Comment> {
    return this.boardService.addComment(comment);
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

  //
  // @Get('/article/:id')
  // async getArticlesByUserId(@Param('id') id): Promise<Article | Article[]> {
  //   return this.boardService.fetchArticleById(id);
  // }

  @Post('/article')
  async addArticle(@Body() article: Article): Promise<Article> {
    return this.boardService.addArticle(article);
  }

  @Get(':page')
  async getListByPage(@Param('page') page: number): Promise<Article[]> {
    return this.boardService.fetchPage(page);
  }
}
