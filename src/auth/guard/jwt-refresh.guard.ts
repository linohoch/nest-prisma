import {
  CanActivate,
  ExecutionContext,
  HttpException, HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtRefreshGuard extends AuthGuard("jwt-refresh") {
  private readonly logger = new Logger(JwtRefreshGuard.name);

  constructor(private reflector: Reflector,
              private jwtService: JwtService,
              private config: ConfigService) {
    super();
  }

  canActivate(
    context: ExecutionContext
  ) {
    let token = null;
    const req = context.switchToHttp().getRequest()
    try {
      token = req.cookies["refresh_token"];
      this.logger.log(`${!!token}`)
      this.jwtService.verify(token, { secret: this.config.get('refreshSecret') });
    } catch (err) {
      this.logger.log(`jwt-r err: ${err.name}: ${err.message}`);
      if (err.name === "TokenExpiredError") {
        throw new HttpException(err.name, HttpStatus.UNAUTHORIZED); //'jwt expired'
      }
      throw new HttpException(err.name, HttpStatus.UNAUTHORIZED);
    }
    return super.canActivate(context)

  }
}
