export type TriageLevel = "STABLE" | "PREVENTIVE" | "PRIORITY" | "URGENT";

export interface TriageOption {
    index: number;
    label: string;
}

export interface TriageQuestion {
    id: string;
    text: string;
    options: TriageOption[];
}

export interface TriageAnswerInput {
    question_id: string;
    option_index: number;
}

export interface TriageResult {
    id: string;
    score: number;
    max_score: number;
    percentage: number;
    level: TriageLevel;
    label: string;
    advice: string;
    recommendation: string;
    created_at: string;
}
