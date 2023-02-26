import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Article } from '@prisma/client';
import { PageSelect } from './types';

@Injectable()
export class BoardService {
  constructor(private prismaService: PrismaService) {}

  async fetchAllArticles(): Promise<Article[]> {
    return this.prismaService.article.findMany();
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
  async fetchNext(param: PageSelect): Promise<any> {
    const { sortOrder, skip, take, page } = param;
    let { startCursor, endCursor } = param;
    const myCursor = sortOrder === 'desc' ? endCursor : startCursor;
    const result = await this.prismaService.article.findMany({
      take: sortOrder === 'desc' ? take : -take,
      ...(myCursor && { skip: 1, cursor: { no: myCursor } }),
      orderBy: {
        no: sortOrder,
      },
    });
    startCursor = result[0].no;
    endCursor = result[result.length - 1].no;
    return {
      startCursor,
      endCursor,
      result,
    };
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
}
