import { Global, Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [BoardService, PrismaService],
  controllers: [BoardController],
})
export class BoardModule {}
