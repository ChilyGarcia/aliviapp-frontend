export interface AdminStats {
    users: {
        total: number;
        patients: number;
        professionals: number;
    };
    appointments: {
        total: number;
        scheduled: number;
        completed: number;
        cancelled: number;
    };
    checkins: {
        total: number;
    };
}

export interface PatientPlanSummary {
    user_id: string;
    full_name: string;
    email: string;
    plan_name: string;
    monthly_limit: number;
    duration_minutes: number;
    consumed_this_month: number;
    remaining_this_month: number;
    is_free_plan: boolean;
}

export interface PlanSummaryResponse {
    paid: PatientPlanSummary[];
    free: PatientPlanSummary[];
    totals: {
        paid_count: number;
        free_count: number;
    };
}
