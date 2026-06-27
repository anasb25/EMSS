import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, AuthUserPayload } from '../auth.service';

interface JwtPayload {
  id: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'emss-dev-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUserPayload> {
    const user = await this.authService.validateUser(payload.id);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
