export type MoodKey = "great" | "good" | "okay" | "low" | "bad";

export interface CheckIn {
    id: string;
    mood: MoodKey;
    mood_label: string;
    mood_score: number;
    energy: number;
    stress: number;
    sleep_hours: number;
    tags: string[];
    note: string;
    created_at: string;
}

export interface CheckInSummary {
    streak_days: number;
    weekly_average: number;
    weekly_average_delta: number;
    total_check_ins: number;
    wellness_index: number;
    weekly_chart: (number | null)[];
    insight: string;
    latest_mood_label: string | null;
    emotional_state: string;
    today_check_in: CheckIn | null;
}

export interface CreateCheckInPayload {
    mood: MoodKey;
    energy: number;
    stress: number;
    sleep_hours: number;
    tags: string[];
    note: string;
}
