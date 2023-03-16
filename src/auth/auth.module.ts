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
import { JwtAccessTokenStrategy } from './guard/jwt.access-token.strategy';
import { JwtRefreshTokenStrategy } from "./guard/jwt.refresh-token.strategy";
import { CacheService } from "../cache/cache.service";
import { DevtoolsModule } from "@nestjs/devtools-integration";
import { ConfigModule } from "@nestjs/config";
import { GoogleStrategy } from "./guard/google.strategy";
import { GoogleAuthStrategy } from "./guard/google-auth.strategy";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule,
    ConfigModule,
    // JwtModule.register({
    //   secret: jwtConstants.secret,
    //   signOptnions: { expiresIn: '60s' },
    // }),
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
    GoogleStrategy,
    GoogleAuthStrategy,
    CacheService,
    UserService,
    PrismaService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
