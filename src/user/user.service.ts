import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../prisma.service';
import { User, UserToken } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { Role } from "../auth/role.enum";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(private prismaService: PrismaService) {}

  async findOne(username: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email: String(username) }
    });
  }
  async selectUserInfoPublic(user: any){
    const result = await this.prismaService.user.findUnique({
      where: { email: String(user)},
      include: {
        articles: {
          select: {
            title: true,
            likeCnt: true
          }
        },
        comment: {
          select: {
            contents: true,
            likeCnt: true
          }
        }
      }
    })
    delete result['pw']
    return result
  }

  async updateUser(data: User): Promise<User | null> {
    return this.prismaService.user.update({
      where: { email: String(data.email) },
      data: data
    })
  }
  async updateUserProvider(email: string, provider: string): Promise<User | null> {
    return this.prismaService.user.update({
        where: { email: String(email) },
        data: { provider: provider }
      }
    );
  }

  async fetchAllUsers(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  async createUser(data: User): Promise<User> {
    const user = await this.findOne(data.email);
    console.log(isNil(user));
    if (user) {
      throw new HttpException(
        "Already registered email",
        HttpStatus.BAD_REQUEST
      );
    } else {
      data.pw = await bcrypt.hash(data.pw, 10);
      const createdUser = await this.prismaService.user.create({
        data: data
      });
      createdUser.pw = null;
      return createdUser;
    }
  }

  async getToken(username: string): Promise<any> {
    return this.prismaService.userToken.findFirst({
      where: { userEmail: username },
      orderBy: {
        insDate: "desc"
      }
    });
  }

  async storeToken(username: string, exp: number, ip: string): Promise<any> {
    await this.deleteTokens(username)
    return this.prismaService.userToken.create({
      data: { userEmail: username, token: exp, ip: ip}
    });
  }

  deleteTokens(username:string) {
      return this.prismaService.userToken.deleteMany({
        where: {
          userEmail: username
        }
      })
  }

  grantRoles(username: string, role: string): Promise<any> {
      return this.prismaService.user.update({
        where: {email: username},
        data: {
          roles: {
            push: [role],
          }
        }
      })
  }
  retrieveRole(username:string, role: string): Promise<any> {
    return this.prismaService.user.update({
      where: {email: username},
      data: {
        roles: {
          set: ['user']
        }
      }
    })
  }
  async deleteUser(username:string, password:string):Promise<any> {
    const { pw, no, ...rest} = await this.prismaService.user.findUnique({
      where: {email: username},
    })
    const isValid = await bcrypt.compare(password, pw);
    if(!isValid) {
      return new HttpException('mismatch password',HttpStatus.UNAUTHORIZED)
    }
    return this.prismaService.user.update({
      where: {email: username},
      data: {
        email: 'deleted-user-'+no,
        pw: '',
        firstName: '',
        lastName:'',
        provider:'',
        roles:[],
        likeArticle:[],
        likeComment:[],
      }
    })
  }

}
