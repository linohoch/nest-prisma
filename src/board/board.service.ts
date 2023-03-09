import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Article, Comment } from '@prisma/client';
import { PageSelect } from './types';

@Injectable()
export class BoardService {
  constructor(private prismaService: PrismaService) {}

  async fetchAllArticles(): Promise<Article[]> {
    return this.prismaService.article.findMany();
  }
  async fetchAllComments(articleNo: number): Promise<Comment[]> {
    return this.prismaService.comment.findMany({
      include: {
        user: true,
      },
      where: {
        articleNo: { equals: articleNo },
      },
      orderBy: {
        grp: 'desc',
        seq: 'asc',
      },
    });
  }

  async addComment(dto: Comment): Promise<Comment> {
    const updatedSeq = await this.prismaService.comment.updateMany({
      where: {
        articleNo: { equals: Number(dto.articleNo) },
        grp: { equals: Number(dto.grp) },
        seq: { gt: Number(dto.seq) },
      },
      data: {
        seq: { increment: 1 },
      },
    });
    const insertedComment = await this.prismaService.comment.create({
      data: {
        grp: Number(dto.grp),
        seq: Number(dto.seq) + 1,
        lv: Number(dto.lv) + 1,
        parent: Number(dto.parent),
        articleNo: Number(dto.articleNo),
        userId: dto.userId,
        contents: dto.contents,
      },
    });
    if (Number(dto.grp) === 0) {
      this.prismaService.comment.update({
        where: {
          no: Number(insertedComment.no),
        },
        data: {
          grp: Number(insertedComment.no),
        },
      });
    }
    return null;
  }
  async deleteComment(comment: number): Promise<Comment> | null {
    return this.prismaService.comment.delete({
      where: {
        no: Number(comment),
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
