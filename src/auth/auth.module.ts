import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './guard/local.strategy';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtAccessTokenStrategy } from './guard/jwt.accessToken.strategy';
import { JwtRefreshTokenStrategy } from "./guard/jwt.refreshToken.strategy";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule
    // JwtModule.register({
    //   secret: jwtConstants.secret,
    //   signOptions: { expiresIn: '60s' },
    // }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
    UserService,
    PrismaService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
