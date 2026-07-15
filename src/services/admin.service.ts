import { apiFetch } from "@/lib/api-client";
import type { AdminStats, PlanSummaryResponse } from "@/types/admin.types";
import type { User } from "@/types/auth.types";

class AdminService {
    async getStats(): Promise<AdminStats> {
        return apiFetch<AdminStats>("/admin/dashboard/stats/");
    }

    async getPlanSummary(): Promise<PlanSummaryResponse> {
        return apiFetch<PlanSummaryResponse>("/admin/users/plan-summary/");
    }

    async getUsers(role?: string): Promise<User[]> {
        const query = role ? `?role=${role}` : "";
        return apiFetch<User[]>(`/admin/users/${query}`);
    }

    async setUserActive(userId: string, isActive: boolean): Promise<User> {
        return apiFetch<User>(`/admin/users/${userId}/`, {
            method: "PATCH",
            body: JSON.stringify({ is_active: isActive }),
        });
    }

    async deactivateUser(userId: string): Promise<void> {
        return apiFetch<void>(`/admin/users/${userId}/`, { method: "DELETE" });
    }
}

export const adminService = new AdminService();
