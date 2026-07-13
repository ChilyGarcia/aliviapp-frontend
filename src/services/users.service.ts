import { apiFetch } from "@/lib/api-client";
import type { User } from "@/types/auth.types";

class UsersService {
    private readonly userCache = new Map<string, User>();

    async listProfessionals(): Promise<User[]> {
        return apiFetch<User[]>("/users/?role=PROFESSIONAL");
    }

    async listPatients(): Promise<User[]> {
        return apiFetch<User[]>("/users/?role=PATIENT");
    }

    async getUserById(userId: string): Promise<User> {
        const cached = this.userCache.get(userId);
        if (cached) return cached;

        const user = await apiFetch<User>(`/users/${userId}/`);
        this.userCache.set(userId, user);
        return user;
    }
}

export const usersService = new UsersService();
