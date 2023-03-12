import {
  ExecutionContext, HttpException, HttpStatus,
  Injectable,
  Logger, UnauthorizedException
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../../public.decorator";
import { JwtService } from "@nestjs/jwt";
import { jwtConstants } from "../constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt-access") {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector,
              private jwtService: JwtService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) {
      this.logger.log('public')
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;

    if (authorization === undefined) {
      throw new HttpException("empty token", HttpStatus.UNAUTHORIZED);
    }
    try {
      this.logger.log(`verify here`);
      const token = authorization.replace("Bearer ", "");
      this.jwtService.verify(token, { secret: jwtConstants.secret });
    } catch (err) {
      this.logger.log(`jwt err: ${err.message} ${err.name}`);
      // if (err.name === "TokenExpiredError") {
      // }
      throw new UnauthorizedException();
    }

    return super.canActivate(context);

  }
}
