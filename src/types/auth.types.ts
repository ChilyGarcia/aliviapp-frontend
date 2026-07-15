export type UserRole = "PATIENT" | "PROFESSIONAL" | "ADMIN";

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    full_name: string;
    password: string;
    role?: UserRole;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginResponse extends AuthTokens {
    user: User;
}
