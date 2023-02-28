import { Global, Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { PrismaService } from '../prisma.service';
import { MulterModule } from '@nestjs/platform-express';

@Global()
@Module({
  imports: [MulterModule.register({ dest: 'upload' })],
  providers: [BoardService, PrismaService],
  controllers: [BoardController],
})
export class BoardModule {}
