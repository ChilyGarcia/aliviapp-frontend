import { apiFetch } from "@/lib/api-client";
import type { ClinicalNote, CreateClinicalNotePayload } from "@/types/clinical-notes.types";

class ClinicalNotesService {
  async create(payload: CreateClinicalNotePayload): Promise<ClinicalNote> {
    return apiFetch<ClinicalNote>("/clinical-notes/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listMine(filters?: { patientId?: string; conversationId?: string }): Promise<ClinicalNote[]> {
    const params = new URLSearchParams();
    if (filters?.patientId) params.set("patient_id", filters.patientId);
    if (filters?.conversationId) params.set("conversation_id", filters.conversationId);
    const query = params.toString();
    return apiFetch<ClinicalNote[]>(`/clinical-notes/${query ? `?${query}` : ""}`);
  }
}

export const clinicalNotesService = new ClinicalNotesService();
