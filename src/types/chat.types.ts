export type ConversationStatus = "ACTIVE" | "EXPIRED" | "CLOSED";

export interface Conversation {
  id: string;
  patient_id: string;
  professional_id: string;
  started_at: string;
  expires_at: string | null;
  status: ConversationStatus;
  last_message_at: string;
  period_active: boolean;
  unread_count: number;
}

export interface MessageMetadata {
  context?: "triage_reply";
  triage_assessment_id?: string;
  triage_label?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  metadata?: MessageMetadata | null;
  period_expires_at?: string | null;
  period_active?: boolean;
}

export interface ChatUsage {
  plan_name: string;
  monthly_chat_limit: number;
  used_this_month: number;
  remaining: number;
}

export interface TriageReplyDraft {
  triage_assessment_id: string;
  triage_label: string;
}
