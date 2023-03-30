import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Article, Comment, User } from "@prisma/client";
import { PageSelect } from "./types";

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name)
  constructor(private prismaService: PrismaService) {
  }

  async fetchAllArticles(): Promise<Article[]> {
    return this.prismaService.article.findMany({
      orderBy: {
        insDate: 'desc'
      }
    });
  }

  async fetchArticleDetail(articleNo: number): Promise<any> {
    return this.prismaService.article.findUnique({
      where: {
        no: Number(articleNo)
      }
    });
  }
  async fetchArticleDetailHit(articleNo: number): Promise<any> {
    console.log('ttt');
    return this.prismaService.article.update({
      where: {
        no: Number(articleNo)
      },
      data: {
        hitCnt: { increment: 1 }
      }
    });
  }

  async fetchAllComments(articleNo: number): Promise<Comment[]> {
    return this.prismaService.comment.findMany({
      // include: {
      //   user: {
      //     select: {
      //       no: true,
      //       email: true
      //     }
      //   }
      // },
      where: {
        articleNo: { equals: Number(articleNo) }
      },
      orderBy: [
        { grp: "desc" },
        { seq: "asc" }
      ]
    });
  }

  async fetchAllCommentsV2(articleNo: number): Promise<Comment[]> {
    return this.prismaService.$queryRaw`select *
                                        from get_comments(${articleNo});`;
  }

  async addComment(dto: Comment): Promise<Comment> {
    const updatedSeq = await this.prismaService.comment.updateMany({
      where: {
        articleNo: { equals: Number(dto.articleNo) },
        grp: { equals: Number(dto.grp) },
        seq: { gt: Number(dto.seq) }
      },
      data: {
        seq: { increment: 1 }
      }
    });
    const insertedComment = await this.prismaService.comment.create({
      data: {
        grp: Number(dto.grp),
        seq: Number(dto.seq) + 1,
        lv: Number(dto.lv) + 1,
        parent: Number(dto.parent),
        articleNo: Number(dto.articleNo),
        userEmail: dto.userEmail,
        contents: dto.contents
      }
    });
    if (Number(dto.grp) === 0) {
      await this.prismaService.comment.update({
        where: {
          no: insertedComment.no
        },
        data: {
          grp: Number(insertedComment.no)
        }
      });
    }
    return null;
  }

  async deleteComment(comment: number): Promise<Comment> | null {
    return this.prismaService.comment.update({
      where: {
        no: Number(comment)
      },
      data: {
        contents: "[deleted]",
        isDelete: true
      }
    });
  }

  async addArticle(article: Article): Promise<Article> {
    return this.prismaService.article.create({
      data: {
        userEmail: article.userEmail,
        title: article.title,
        contents: article.contents
      }
    });
  }
  async updateArticle(user: string, no: number, article: Article): Promise<any> {
    const { userEmail } = await this.prismaService.article.findUnique({
      where: {
        no: Number(no)
      },
      select: {
        userEmail: true
      }
    })
    if(userEmail!==user){ return new HttpException('no authority', HttpStatus.FORBIDDEN)}

    return this.prismaService.article.update({
      where: {
        no: Number(no)
      },
      data: {
        title: article.title,
        contents: article.contents
      }
    })
  }
  async deleteArticle(no: number): Promise<any> {
    return this.prismaService.article.update({
      where: {
        no: no
      },
      data: {
        title: '[deleted]',
        contents: '[deleted]',
        isDelete: true
      }
    })
  }

//User

  async addLikeArticle(userEmail: string, article: number):Promise<any> {
    const { likeArticle } = await this.prismaService.user.findUnique({
      where: {
        email: userEmail
      },
      select: {
        likeArticle: true
      }
    })
    if(likeArticle.includes(Number(article))){
      this.logger.log('invalid call')
      return this.prismaService.article.findUnique({
        where: {
          no: Number(article)
        }
      })
    }
    await this.prismaService.user.update({
      where: {
        email: userEmail,
      },
      data: {
        likeArticle: {push: Number(article)}
      }
    })
    return this.prismaService.article.update({
      where: {
        no: Number(article)
      },
      data: {
        likeCnt: { increment: 1 }
      }
    });
  }
  async subLikeArticle(userEmail: string, article: number):Promise<any> {
    const { likeArticle } = await this.prismaService.user.findUnique({
      where: {
        email: userEmail
      },
      select: {
        likeArticle: true
      }
    })
    await this.prismaService.user.update({
      where: {
        email: userEmail,
      },
      data: {
        likeArticle: {
          set: likeArticle.filter((no)=> no !== Number(article))
        },
      }
    })
    return this.prismaService.article.update({
      where: {
        no: Number(article),
      },
      data: {
        likeCnt: { decrement:1 }
      }
    })
  }
  async addLikeComment(userEmail: string, comment: number): Promise<Comment> | null {
    await this.prismaService.user.update({
      where: {
        email: userEmail,
      },
      data: {
        likeComment: {push: Number(comment)}
      }
    })

    return this.prismaService.comment.update({
      where: {
        no: Number(comment)
      },
      data: {
        likeCnt: { increment: 1 }
      }
    });
  }

  async subLikeComment(userEmail: string, comment: number): Promise<Comment> | null {
    const { likeComment } = await this.prismaService.user.findUnique({
      where: {
        email: userEmail
      },
      select: {
        likeComment: true
      },
    });
    await this.prismaService.user.update({
      where: {
        email: userEmail
      },
      data: {
        likeComment: {
          set: likeComment.filter((no) => no !== Number(comment)),
        },
      },
    });
    return this.prismaService.comment.update({
      where: {
        no: Number(comment)
      },
      data: {
        likeCnt: { decrement: 1 }
      }
    });
  }

  async fetchArticlesPage(page: number): Promise<any> {
    const total = this.prismaService.article.count();
    const articles = this.prismaService.article.findMany({
      take: 5,
      skip: (page - 1) * 5,
      orderBy: {
        no: "desc"
      }
    });
    return { total: total, articles: articles };
  }

  async fetchNext(param: PageSelect): Promise<any> {
    const { sortOrder, skip, take, page } = param;
    let { startCursor, endCursor } = param;
    const myCursor = sortOrder === "desc" ? endCursor : startCursor;
    const result = await this.prismaService.article.findMany({
      take: sortOrder === "desc" ? take : -take,
      ...(myCursor && { skip: 1, cursor: { no: myCursor } }),
      orderBy: {
        no: sortOrder
      }
    });
    startCursor = result[0].no;
    endCursor = result[result.length - 1].no;
    return {
      startCursor,
      endCursor,
      result
    };
  }

}
