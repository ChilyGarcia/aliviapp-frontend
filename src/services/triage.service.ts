import { apiFetch } from "@/lib/api-client";
import type { TriageAnswerInput, TriageQuestion, TriageResult } from "@/types/triage.types";

class TriageService {
    async getQuestions(): Promise<TriageQuestion[]> {
        return apiFetch<TriageQuestion[]>("/triage/questions/");
    }

    async submit(answers: TriageAnswerInput[]): Promise<TriageResult> {
        return apiFetch<TriageResult>("/triage/assessments/", {
            method: "POST",
            body: JSON.stringify({ answers }),
        });
    }

    async getHistory(): Promise<TriageResult[]> {
        return apiFetch<TriageResult[]>("/triage/assessments/");
    }

    async getById(assessmentId: string): Promise<TriageResult> {
        return apiFetch<TriageResult>(`/triage/assessments/${assessmentId}/`);
    }
}

export const triageService = new TriageService();
