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
} from '@nestjs/common';
import { BoardService } from './board.service';
import { Article, Photo, Comment, User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../config/multerOptions';

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

  @Get()
  async getAllArticles(): Promise<Article[]> {
    return this.boardService.fetchAllArticles();
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
