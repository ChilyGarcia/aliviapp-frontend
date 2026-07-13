import { apiFetch } from "@/lib/api-client";
import type { LoginCredentials, LoginResponse, RegisterPayload, User } from "@/types/auth.types";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

function decodeJwtExpiryMs(token: string): number | null {
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
    } catch {
        return null;
    }
}

class AuthService {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const data = await apiFetch<LoginResponse>("/auth/login/", {
            method: "POST",
            auth: false,
            body: JSON.stringify(credentials),
        });
        this.setSession(data);
        return data;
    }

    async register(payload: RegisterPayload): Promise<User> {
        return apiFetch<User>("/users/", {
            method: "POST",
            auth: false,
            body: JSON.stringify(payload),
        });
    }

    logout(): void {
        this.clearAuth();
    }

    setSession(data: LoginResponse): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    getUser(): User | null {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    }

    clearAuth(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;

        const expiryMs = decodeJwtExpiryMs(token);
        if (expiryMs !== null && expiryMs < Date.now()) {
            this.clearAuth();
            return false;
        }
        return true;
    }
}

export const authService = new AuthService();
