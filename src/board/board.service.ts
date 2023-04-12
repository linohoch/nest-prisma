import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Article, Comment, Photo, User } from "@prisma/client";
import { PageSelect } from "./types";

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name)
  constructor(private prismaService: PrismaService) {
  }

  /**
   * 최근 업데이트 comment 1개 조인,
   * article 업데이트 정렬
   * @param user  userEmail //TODO 유저번호로 변경
   * @param page
   * @param option? 'date' | 'like'
   * @param order? 'desc' | 'asc'
   * @param limit? 10
   */
  async findAllArticleRelationByEmail(user: string,
                                      page = 1,
                                      option: "date" | "like" = "date",
                                      order: "desc" | "asc" = "desc",
                                      limit = 10): Promise<any> {

    const condition =(option==='date')
      ?`order by article.up_date ${order} limit ${limit} offset ${(page-1) * limit}`
      :`order by article.like_cnt ${order}, article.hit_cnt ${order} limit ${limit} offset ${(page-1) * limit}`;

    this.logger.log(`page:${page},limit:${limit},orderBy:${option},order:${order}`)
    return this.prismaService.$queryRawUnsafe(`
        select article.article_no as "articleNo",
               article.user_email as "userEmail",
               article.title as "title",
               article.like_cnt as "likeCnt",
               article.hit_cnt as "hitCnt",
               article.ins_date as "insDate",
               article.up_date as "upDate",
               article.contents as "contents",
               article.deleted as "isDeleted",
               comment_no as "commentNo",
               comment.user_email as "cUserEmail",
               comment.contents as "cContents",
               comment.like_cnt as "cLikeCnt",
               comment.ins_date as "cInsDate",
               comment.up_date as "cUpDate"
        from "Article" article
                 left join
             (select *
              from "Comment" raw
                       inner join
                   (select max(up_date) as late
                    from "Comment"
                    group by article_no) max on raw.up_date = max.late) as comment
             on article.article_no = comment.article_no
        where article.user_email = '${user}'
        ${condition}`);
  }

  /**
   * 나의 댓글에 부모댓글 조인,
   * 부모댓글이 없는 경우 게시글 조인
   * 부모댓글 or 게시글 and 댓글 중 가장 최근 업데이트 기준 정렬
   * @param user  userEmail
   * @param order? 'desc' | 'asc'
   */
  async findAllCommentsRelationByEmail(user: string,
                                       order: "desc" | "asc" = "desc"): Promise<any> {
    const condition = `order by late ${order}`
    return this.prismaService.$queryRawUnsafe(`
    select 
        parent.comment_no as pCommentNo,
        parent.user_email as pUserEmail,
        parent.contents as pContents,
        parent.like_cnt as pLikeCnt,
        parent.ins_date as pInsDate,
        parent.up_date as pUpDate,
        parent.deleted as pIsDeleted,
        article.article_no as articleNo,
        article.user_email as aUserEmail,
        article.title as aTitle,
        article.contents as aContents,
        article.hit_cnt as aHitCnt,
        article.like_cnt as aLikeCnt,
        article.ins_date as aInsDate,
        article.up_date as aUpDate,
        article.deleted as aIsDeleted,
        comment.comment_no as no,
        comment.user_email as userEmail,
        comment.contents as contents,
        comment.like_cnt as likeCnt,
        comment.deleted as isDeleted,
        comment.ins_date as insDate,
        comment.up_date as upDate,
        greatest(comment.up_date, parent.up_date, article.up_date) as late
    from "Comment" comment
         left join "Comment" parent on comment.parent=parent.comment_no
         left join "Article" article on comment.article_no=article.article_no
                                    and comment.parent=0
    where comment.user_email = '${user}'
    ${condition};`);
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
      },
    });
  }
  async fetchArticleDetailHit(articleNo: number): Promise<any> {
    console.log('hitup');
    return this.prismaService.article.update({
      where: {
        no: Number(articleNo)
      },
      data: {
        hitCnt: { increment: 1 }
      },
    });
  }
  async fetchPhotos(articleNo: number): Promise<any> {
    return this.prismaService.photo.findMany({
      where: {
        articleNo: Number(articleNo)
      }
    })
  }
  async delete(photoNo: number): Promise<any> {
    return this.prismaService.photo.delete({
      where: {
        no: Number(photoNo),
      }
    })
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
        contents: article.contents,
        pw: article.pw?article.pw:null
      }
    });
  }
  async updateAnny(article: Article) {
    return this.prismaService.article.update({
      where: {
        no: Number(article.no)
      },
      data: {
        title: article.title,
        contents: article.contents,
        pw: article.pw
      }
    })
  }
  async deleteAnny(no: number) {
    // if(await this.matchAnnyPw(article)){
      return this.prismaService.article.update({
        where: {
          no: Number(no)
        },
        data: {
          title: '[deleted]',
          contents: '[deleted]',
          isDelete: true
        }
      })
    // }
  }
  async matchAnnyPw(article: Article): Promise<boolean> {
    const { userEmail, pw } = await this.prismaService.article.findUnique({
      where: {
        no: Number(article.no)
      },
      select: {
        userEmail: true,
        pw: true,
      }
    })
    if(userEmail!=='anonymous' || pw!==article.pw){
      new HttpException('no authority', HttpStatus.FORBIDDEN)
      return false
    }
    return true
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

  addPhoto(photo:any): Promise<Photo> {
    return this.prismaService.photo.create({
      data:{
        articleNo: Number(photo.articleNo),
        origin: photo.origin,
        upload: photo.upload,
        url: photo.url,
        size: photo.size
      }
    })
  }
  addPhotos(photos:Photo[]): Promise<any> {
    return this.prismaService.photo.createMany({
      data: photos
    })
  }
}
