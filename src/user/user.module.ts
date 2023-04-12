import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { BoardService } from "../board/board.service";

@Global()
@Module({
  providers: [BoardService, UserService, PrismaService],
  controllers: [UserController],
})
export class UserModule {}
