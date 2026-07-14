export interface Plan {
    id: string;
    name: string;
    monthly_chat_limit: number;
    chat_duration_minutes: number;
    is_default: boolean;
}

export interface UserPlan {
    user_id: string;
    plan_name: string;
    monthly_chat_limit: number;
    chat_duration_minutes: number;
}

/** Formatea duración del chat (ej. 30 → "30 min", 1440 → "24 h"). */
export function formatChatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1)} h`;
}
