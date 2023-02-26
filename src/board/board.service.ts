import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Article } from '@prisma/client';

@Injectable()
export class BoardService {
  constructor(private prismaService: PrismaService) {}

  async fetchAllArticles(): Promise<Article[]> {
    return this.prismaService.article.findMany();
  }
  async addArticle(article: Article): Promise<Article> {
    return this.prismaService.article.create({
      data: {
        userId: article.userId,
        title: article.title,
        contents: article.contents,
      },
    });
  }
  async fetchPage(page: number): Promise<Article[]> {
    return this.prismaService.article.findMany({
      take: 5,
      skip: (page - 1) * 5,
      orderBy: {
        no: 'desc',
      },
    });
  }

  async fetchNext(myCursor: number): Promise<Article[]> {
    const result = await this.prismaService.article.findMany({
      take: 10,
      ...(myCursor && { skip: 1, cursor: { no: myCursor } }),
      orderBy: {
        no: 'desc',
      },
    });
    const lastArticle = result[9];
    const nextCursor = lastArticle.no;
    return result;
  }

}
