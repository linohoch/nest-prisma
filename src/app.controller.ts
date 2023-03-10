import {
  CACHE_MANAGER,
  CacheInterceptor,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './auth/guard/local-auth.guard';
import { Cache } from 'cache-manager';
import { Public } from './public.decorator';

// @UseInterceptors(CacheInterceptor)
@Controller()
export class AppController {
  testString = 'cached';
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Public()
  @Get('cache')
  async getCache(): Promise<string> {
    const cachedData = await this.cacheManager.get('test');
    if (cachedData) {
      return String(cachedData) + 'from redis';
    }
    await this.cacheManager.set('test', this.testString, { ttl: 300 });
    return this.testString;
  }
  @Get('error')
  throwError() {
    throw new InternalServerErrorException();
  }
}
