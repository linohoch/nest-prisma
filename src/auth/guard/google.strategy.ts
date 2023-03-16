import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { ConfigService, ConfigType } from "@nestjs/config";
import { Inject, Injectable, Logger } from "@nestjs/common";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name)
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>("google.clientId"),
      clientSecret: configService.get<string>("google.clientSecret"),
      callbackURL: configService.get<string>("google.callbackUrl"),
      scope: ["email", "profile"]
          });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const { id, emails, name } = profile
    this.logger.log(emails)
    return {
      providerId: id,
      provider: 'google',
      fistName: name.givenName,
      lastName: name.familyName,
      email: emails[0].value
    }
  }
}