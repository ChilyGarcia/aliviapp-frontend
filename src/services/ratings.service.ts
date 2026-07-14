import { apiFetch } from "@/lib/api-client";
import type {
  CreateRatingPayload,
  ProfessionalMetrics,
  ProfessionalRatingSummary,
  Rating,
  RatingEligibility,
} from "@/types/ratings.types";
import type { TriageResult } from "@/types/triage.types";

export interface PatientTriageAlert {
  patient_id: string;
  patient_name: string;
  triage: TriageResult;
}

class RatingsService {
  async getEligibility(professionalId: string): Promise<RatingEligibility> {
    return apiFetch<RatingEligibility>(
      `/ratings/eligibility/?professional_id=${professionalId}`
    );
  }

  async createRating(payload: CreateRatingPayload): Promise<Rating> {
    return apiFetch<Rating>("/ratings/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMySummary(): Promise<ProfessionalRatingSummary> {
    return apiFetch<ProfessionalRatingSummary>("/ratings/professionals/me/summary/");
  }

  async getProfessionalSummary(professionalId: string): Promise<ProfessionalRatingSummary> {
    return apiFetch<ProfessionalRatingSummary>(
      `/ratings/professionals/${professionalId}/summary/`
    );
  }

  async getMyMetrics(): Promise<ProfessionalMetrics> {
    return apiFetch<ProfessionalMetrics>("/ratings/professionals/me/metrics/");
  }
}

class ProfessionalInsightsService {
  async listContactedPatientsTriage(): Promise<PatientTriageAlert[]> {
    return apiFetch<PatientTriageAlert[]>("/triage/professional/contacted-patients/");
  }
}

export const ratingsService = new RatingsService();
export const professionalInsightsService = new ProfessionalInsightsService();
