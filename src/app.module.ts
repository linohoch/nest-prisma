import { CacheInterceptor, CacheModule, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { BoardModule } from './board/board.module';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
// import * as redisStore from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-ioredis';
import { HttpExceptionFilter } from './filter/http-exception/http-exception.filter';
import { LoggingInterceptor } from './interceptor/logging/logging.interceptor';
import { PrismaClientExceptionFilter } from './filter/prisma-client-exception/prisma-client-exception.filter';
import { LoggingMiddleware } from './middleware/logging/logging.middleware';
import { JwtService } from "@nestjs/jwt";
import { JwtRefreshGuard } from "./auth/guard/jwt-refresh.guard";
// import { PrismaClientExceptionFilter } from "./filter/prisma-client-exception/prisma-client-exception.filter";

@Module({
  imports: [
    UserModule,
    BoardModule,
    AuthModule,
    // CacheModule.register({
    //   isGlobal: true,
    //   ttl: 5,
    //   max: 10,
    // })
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      isGlobal: true,
      ttl: 5, // seconds
      max: 10, // maximum number of items in cache
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
