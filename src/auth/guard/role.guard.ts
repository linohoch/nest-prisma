import { Role } from "../role.enum";
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const roleMatch = roles.some((role) => user?.roles?.includes(role));
    if(roleMatch) {
      return true
    }
    throw new HttpException('access denied', HttpStatus.FORBIDDEN)
  }
}