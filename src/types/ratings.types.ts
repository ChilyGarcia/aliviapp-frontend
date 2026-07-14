export interface RatingEligibility {
  eligible: boolean;
  already_rated: boolean;
  patient_messages: number;
  professional_messages: number;
  required_messages: number;
}

export interface Rating {
  id: string;
  patient_id: string;
  professional_id: string;
  patient_name: string;
  score: number;
  comment: string;
  created_at: string;
}

export interface ProfessionalRatingSummary {
  professional_id: string;
  average_score: number;
  total_ratings: number;
  recent_ratings: Rating[];
}

export interface TopicStat {
  label: string;
  count: number;
  percentage: number;
}

export interface WeekStat {
  label: string;
  count: number;
}

export interface ProfessionalMetrics {
  sessions_this_month: number;
  completed_this_month: number;
  unique_patients: number;
  average_score: number;
  total_ratings: number;
  sessions_by_week: WeekStat[];
  top_topics: TopicStat[];
}

export interface CreateRatingPayload {
  professional_id: string;
  score: number;
  comment?: string;
}
