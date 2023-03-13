import { CACHE_MANAGER, Inject, Injectable, Logger } from "@nestjs/common";
import { Cache } from "cache-manager";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

  setCache(key: string, token: string, exp: number): Promise<any> {
    return this.cacheManager.set(key, token, { ttl: exp });
  }

  getCache(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  delCache(key: string): Promise<any> {
    return this.cacheManager.del(key);
  }
}
