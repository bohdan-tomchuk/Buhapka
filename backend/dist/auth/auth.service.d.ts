import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
export declare class AuthService {
    private readonly refreshTokenRepository;
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(refreshTokenRepository: Repository<RefreshToken>, usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(email: string, password: string): Promise<{
        id: string;
        email: string;
        created_at: Date;
        updated_at: Date;
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(refreshToken: string): Promise<void>;
}
