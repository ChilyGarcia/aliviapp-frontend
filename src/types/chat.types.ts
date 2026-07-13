export type ConversationStatus = "ACTIVE" | "EXPIRED" | "CLOSED";

export interface Conversation {
    id: string;
    patient_id: string;
    professional_id: string;
    started_at: string;
    expires_at: string;
    status: ConversationStatus;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    sent_at: string;
}

export interface ChatUsage {
    plan_name: string;
    monthly_chat_limit: number;
    used_this_month: number;
    remaining: number;
}
