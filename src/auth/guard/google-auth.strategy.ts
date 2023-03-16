import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "../auth.service";
import { OAuth2Client } from "google-auth-library";
import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-custom";

@Injectable()
export class GoogleAuthStrategy extends PassportStrategy(Strategy, "google-auth") {
  private readonly logger = new Logger(GoogleAuthStrategy.name);
  client_id = this.config.get<string>("google.clientId");
  client = new OAuth2Client(this.client_id);

  constructor(private config: ConfigService,
              private authService: AuthService) {
    super((req)=>{
      // return this.client.verifyIdToken({
      //   idToken: req.body.credential,
      //   audience: this.client_id
      // });
    });
  }

  async authenticate (token: any) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: this.client_id
    });
    const payload = ticket.getPayload()
    this.logger.log(`ticket: ${ticket.toString()}`)

    return { email: payload.email, sub: payload.sub }
  }

}