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
  Req, Delete, UseFilters, Put, Request, Query, Logger, HttpException, HttpStatus, UploadedFiles
} from "@nestjs/common";
import { BoardService } from "./board.service";
import { Article, Photo, Comment, User } from "@prisma/client";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { multerOptions } from "../config/multerOptions";
import { Public } from "../auth/custom.decorator";
import { HttpExceptionFilter } from "../filter/http-exception/http-exception.filter";
import multer, { memoryStorage } from "multer";
import * as AWS from "aws-sdk";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";

@Controller("/api/v1/board")
export class BoardController {
  private readonly logger = new Logger(BoardController.name);

  constructor(private boardService: BoardService,
              private config: ConfigService) {
  }

  @Public()
  @Post("/article/:articleNo/photo")
  @UseInterceptors(FileInterceptor("image", multerOptions))
  async uploadFile(
    @Param('articleNo') articleNo,
    @UploadedFile() file: Express.Multer.File,
    @Body() body
  ) {
    AWS.config.update({
      credentials: {
        accessKeyId: this.config.get("ACCESS_KEY_ID"),
        secretAccessKey: this.config.get("SECRET_ACCESS_KEY")
      },
      region: this.config.get("REGION")
    });
    const date = new Date();
    const dateFormat = date.toISOString().slice(0, 10);
    const key = dateFormat + "-" + uuidv4() + "-" + file.originalname;
    const s3Client = new AWS.S3();
    try {
      const s3Object = await s3Client.upload({
        Bucket: this.config.get("BUCKET"),
        Body: file.buffer,
        Key: key
      }).promise();
      const result = await this.boardService.addPhoto({
        articleNo: articleNo,
        origin: file.originalname,
        upload: s3Object.Key,
        url: s3Object.Location,
        size: file.size,
      })
      return { message:'success', result };
    } catch (err) {
      // throw err
      this.logger.log('upload failed',err.message,'//',file)
      return { message:'fail', }
    }

  }
  @Public()
  @Get("/article/:articleNo/photo")
  async getPhotos(
    @Param('articleNo') articleNo
  ){
    return this.boardService.fetchPhotos(articleNo)
  }

  @Public()
  @Delete("/article/:articleNo/photo/:photoNo")
  async deletePhoto(
    @Param('articleNo') articleNo,
    @Param('photoNo') photoNo
  ) {
    const deleted =  await this.boardService.delete(photoNo)
    
    AWS.config.update({
      credentials: {
        accessKeyId: this.config.get("ACCESS_KEY_ID"),
        secretAccessKey: this.config.get("SECRET_ACCESS_KEY")
      },
      region: this.config.get("REGION")
    });
    const s3Client = new AWS.S3();
    const result = await s3Client.deleteObject({
      Bucket:this.config.get('BUCKET'),
      Key: deleted.upload
    })
    return deleted.no
  }

  /**
   *
   * @param req
   * @param files file의 originalname에 본문 식별용도로 uuid-가 붙어서 온다.
   * @param body
   */
  @Public()
  @Post("/article")
  @UseInterceptors(FilesInterceptor("image", 10, multerOptions))
  async addArticle(@Request() req,
                   @UploadedFiles() files: Array<Express.Multer.File>,
                   @Body() body): Promise<any> {
    const article = JSON.parse(JSON.stringify(body))
    //
    AWS.config.update({
      credentials: {
        accessKeyId: this.config.get("ACCESS_KEY_ID"),
        secretAccessKey: this.config.get("SECRET_ACCESS_KEY")
      },
      region: this.config.get("REGION")
    });
    const s3Client = new AWS.S3();
    const photos = []
    for(const file of files){
      const date = new Date();
      const dateFormat = date.toISOString().slice(0, 10);
      const key = dateFormat + '-' + file.originalname;
      try {
        const s3Object = await s3Client.upload({
          Bucket: this.config.get("BUCKET"),
          Body: file.buffer,
          Key: key
        }).promise();

        article.contents = article.contents.replaceAll(file.originalname, s3Object.Location)

        photos.push({origin: file.originalname.slice(37),
                     upload: s3Object.Key,
                     url: s3Object.Location,
                     size: file.size})
      } catch (err) {
        console.log('s3 failed');
      }
    }
    //
    console.log(article);
    const articleAdded = await this.boardService.addArticle(article);
    const articleNo = articleAdded.no

    //
    photos.forEach(photo=>{
      photo.articleNo=articleNo
    })
    await this.boardService.addPhotos(photos)

    return articleAdded

  }

  @Public()
  @Get()
  async getAllArticles(): Promise<Article[]> {
    return this.boardService.fetchAllArticles();
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
  @Get("/article/:articleNo")
  async getArticleDetail(@Param("articleNo") no, @Query("isRead") isRead): Promise<Article | Article[]> {
    if (isRead === "true") {
      return this.boardService.fetchArticleDetail(Number(no));
    } else {
      return this.boardService.fetchArticleDetailHit(Number(no));
    }
  }

  @Put("/article/:articleNo")
  async putArticle(@Request() req,
                   @Param("articleNo") no,
                   @Body() article: Article): Promise<Article> {
    return this.boardService.updateArticle(req.user.username, Number(no), article);
  }

  @Delete("/article/:articleNo")
  async deleteArticle(@Param("articleNo") no): Promise<any> {
    return this.boardService.deleteArticle(Number(no));

  }

  @Get(":page")
  async getListByPage(@Param("page") page: number): Promise<any> {
    return this.boardService.fetchArticlesPage(page);
  }

  @Public()
  @Get("/article/:articleNo/comment")
  async getAllComments(@Param("articleNo") no: number): Promise<Comment[]> {
    return this.boardService.fetchAllCommentsV2(no);
  }

  @Post("/article/:articleNo/comment")
  async addComment(@Req() req, @Body() comment: Comment): Promise<Comment> {
    console.log(req.user);
    return this.boardService.addComment(comment);
  }

  @UseFilters(new HttpExceptionFilter())
  @Delete("/article/:articleNo/comment/:commentNo")
  async deleteComment(
    @Param("commentNo") comment: number,
    @Param("articleNo") article: number
  ): Promise<Comment> {
    return this.boardService.deleteComment(comment);
  }

  //annym public
  @Public()
  @Post("article/anny")
  async addArticleAnonymous(@Body() article: Article): Promise<any> {
    return this.boardService.addArticle(article);
  }

  @Public()
  @Post("article/anny/pw")
  async matchArticleAnonymous(@Body() article: Article): Promise<any> {
    return this.boardService.matchAnnyPw(article);
  }

  @Public()
  @Put("article/anny/:articleNo")
  async editArticleAnonymous(
    @Param("articleNo") no: number,
    @Body() article: Article): Promise<any> {
    return this.boardService.updateAnny(article);
  }

  @Public()
  @Delete("article/anny/:articleNo")
  async delArticleAnonymous(@Param("articleNo") no: number): Promise<any> {
    return this.boardService.deleteAnny(no);
  }

}
