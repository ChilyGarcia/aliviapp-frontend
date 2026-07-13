import { apiFetch } from "@/lib/api-client";
import type { Plan, UserPlan } from "@/types/plan.types";

class PlansService {
    async listPlans(): Promise<Plan[]> {
        return apiFetch<Plan[]>("/plans/", { auth: false });
    }

    async changePlan(planName: string): Promise<UserPlan> {
        return apiFetch<UserPlan>("/users/me/plan/", {
            method: "PATCH",
            body: JSON.stringify({ plan_name: planName }),
        });
    }
}

export const plansService = new PlansService();
