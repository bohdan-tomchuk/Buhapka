"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
let AuthService = class AuthService {
    refreshTokenRepository;
    usersService;
    jwtService;
    configService;
    constructor(refreshTokenRepository, usersService, jwtService, configService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(email, password) {
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const user = await this.usersService.create(email, password);
        const { password: passwordField, refresh_tokens, ...result } = user;
        return result;
    }
    async login(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const access_token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
        });
        const refresh_token = this.jwtService.sign({ sub: user.id, type: 'refresh' }, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
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
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            if (payload.type !== 'refresh') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const userTokens = await this.refreshTokenRepository.find({
                where: { user_id: payload.sub },
            });
            let validToken = null;
            for (const token of userTokens) {
                const isMatch = await bcrypt.compare(refreshToken, token.token_hash);
                if (isMatch) {
                    validToken = token;
                    break;
                }
            }
            if (!validToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            if (validToken.expires_at < new Date()) {
                await this.refreshTokenRepository.remove(validToken);
                throw new common_1.UnauthorizedException('Refresh token expired');
            }
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            await this.refreshTokenRepository.remove(validToken);
            const access_token = this.jwtService.sign({
                sub: user.id,
                email: user.email,
            });
            const new_refresh_token = this.jwtService.sign({ sub: user.id, type: 'refresh' }, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            });
            const tokenHash = await bcrypt.hash(new_refresh_token, 10);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await this.refreshTokenRepository.save({
                token_hash: tokenHash,
                user_id: user.id,
                expires_at: expiresAt,
            });
            return { access_token, refresh_token: new_refresh_token };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
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
        }
        catch {
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map