import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        created_at: Date;
        updated_at: Date;
    }>;
    login(loginDto: LoginDto, res: Response): Promise<{
        message: string;
    }>;
    refresh(req: Request, res: Response): Promise<{
        message: string;
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
}
