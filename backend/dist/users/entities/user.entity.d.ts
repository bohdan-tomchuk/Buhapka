export declare class User {
    id: string;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
    refresh_tokens: any[];
    hashPassword(): Promise<void>;
    validatePassword(password: string): Promise<boolean>;
}
