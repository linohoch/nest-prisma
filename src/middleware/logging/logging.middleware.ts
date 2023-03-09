import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: any, res: any, next: () => void) {
    const userAgent = req.get('user-agent') || '';
    const { ip, method, path: url } = req;

    this.logger.log(
      `middle: ${method} ${url} ${userAgent} ${ip} ${res.statusCode}
      }`,
    );
    next();
  }
}
