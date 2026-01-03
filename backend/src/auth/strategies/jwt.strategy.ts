import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, ExtractJwt } from 'passport-jwt';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token as string;
        },
      ]),
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'fallback-secret-key',
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
