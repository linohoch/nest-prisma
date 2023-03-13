import {
  CanActivate,
  ExecutionContext,
  HttpException, HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";
import { jwtConstants } from "../constants";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../../public.decorator";
import { Reflector } from "@nestjs/core";
import { isUndefined } from "@nestjs/common/utils/shared.utils";

@Injectable()
export class JwtRefreshGuard extends AuthGuard("jwt-refresh") {
  private readonly logger = new Logger(JwtRefreshGuard.name);

  constructor(private reflector: Reflector,
              private jwtService: JwtService) {
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
      this.jwtService.verify(token, { secret: jwtConstants.refreshSecret });
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
