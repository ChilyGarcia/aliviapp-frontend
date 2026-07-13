export interface Plan {
    id: string;
    name: string;
    monthly_chat_limit: number;
    chat_duration_hours: number;
    is_default: boolean;
}

export interface UserPlan {
    user_id: string;
    plan_name: string;
    monthly_chat_limit: number;
    chat_duration_hours: number;
}
