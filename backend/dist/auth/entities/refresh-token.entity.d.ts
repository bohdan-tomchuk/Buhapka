import { User } from '../../users/entities/user.entity';
export declare class RefreshToken {
    id: string;
    token_hash: string;
    user: User;
    user_id: string;
    created_at: Date;
    expires_at: Date;
}
