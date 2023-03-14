import { CACHE_MANAGER, Controller, Get, Inject, InternalServerErrorException, Request } from "@nestjs/common";
import { AppService } from "./app.service";
import { Cache } from "cache-manager";
import { Public, Roles } from "./auth/custom.decorator";
import { Role } from "./auth/role.enum";

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

  @Roles(Role.User)
  @Get('user')
  onlyUser(@Request() req) {
    return req.user;
  }

  @Roles(Role.Admin)
  @Get('admin')
  onlyAdmin(@Request() req) {
    return req.user;
  }
}
