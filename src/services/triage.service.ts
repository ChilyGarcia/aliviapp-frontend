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
}

export const triageService = new TriageService();
