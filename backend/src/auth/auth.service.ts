import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(email: string, password: string): Promise<{
    id: string;
    email: string;
    created_at: Date;
    updated_at: Date;
  }> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(email, password);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: passwordField, refresh_tokens, ...result } = user;
    return result;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const tokenHash = await bcrypt.hash(refresh_token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save({
      token_hash: tokenHash,
      user_id: user.id,
      expires_at: expiresAt,
    });

    return { access_token, refresh_token };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        type: string;
      }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userTokens = await this.refreshTokenRepository.find({
        where: { user_id: payload.sub },
      });

      let validToken: RefreshToken | null = null;
      for (const token of userTokens) {
        const isMatch = await bcrypt.compare(refreshToken, token.token_hash);
        if (isMatch) {
          validToken = token;
          break;
        }
      }

      if (!validToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (validToken.expires_at < new Date()) {
        await this.refreshTokenRepository.remove(validToken);
        throw new UnauthorizedException('Refresh token expired');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.refreshTokenRepository.remove(validToken);

      const access_token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      const new_refresh_token = this.jwtService.sign(
        { sub: user.id, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      );

      const tokenHash = await bcrypt.hash(new_refresh_token, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.refreshTokenRepository.save({
        token_hash: tokenHash,
        user_id: user.id,
        expires_at: expiresAt,
      });

      return { access_token, refresh_token: new_refresh_token };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const userTokens = await this.refreshTokenRepository.find({
        where: { user_id: payload.sub },
      });

      for (const token of userTokens) {
        const isMatch = await bcrypt.compare(refreshToken, token.token_hash);
        if (isMatch) {
          await this.refreshTokenRepository.remove(token);
          break;
        }
      }
    } catch {
      // Silently fail if token is invalid
    }
  }
}
