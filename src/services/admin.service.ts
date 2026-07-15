import { apiFetch } from "@/lib/api-client";
import type { AdminStats } from "@/types/admin.types";
import type { User } from "@/types/auth.types";

class AdminService {
    async getStats(): Promise<AdminStats> {
        return apiFetch<AdminStats>("/admin/dashboard/stats/");
    }

    async getUsers(role?: string): Promise<User[]> {
        const query = role ? `?role=${role}` : "";
        return apiFetch<User[]>(`/admin/users/${query}`);
    }

    async deactivateUser(userId: string): Promise<void> {
        return apiFetch<void>(`/admin/users/${userId}/`, { method: "DELETE" });
    }
}

export const adminService = new AdminService();
