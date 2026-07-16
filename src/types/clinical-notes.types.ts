export interface ClinicalNote {
  id: string;
  professional_id: string;
  patient_id: string;
  patient_name: string;
  conversation_id: string;
  categories: string[];
  reason: string;
  observations: string;
  therapeutic_plan: string;
  next_session_at: string | null;
  created_at: string;
}

export interface CreateClinicalNotePayload {
  conversation_id: string;
  categories: string[];
  reason: string;
  observations?: string;
  therapeutic_plan?: string;
  next_session_at?: string | null;
}

export const CLINICAL_NOTE_CATEGORIES: { value: string; label: string }[] = [
  { value: "anxiety", label: "Ansiedad" },
  { value: "sleep", label: "Sueño" },
  { value: "depression", label: "Depresión" },
  { value: "stress", label: "Estrés" },
  { value: "grief", label: "Duelo" },
  { value: "self_esteem", label: "Autoestima" },
  { value: "relationships", label: "Relaciones de pareja / familia" },
  { value: "trauma", label: "Trauma" },
  { value: "anger_management", label: "Manejo de la ira" },
  { value: "substance_use", label: "Consumo de sustancias" },
  { value: "general_consultation", label: "Motivo de consulta general" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "other", label: "Otro" },
];

export const clinicalNoteCategoryLabel = (value: string): string =>
  CLINICAL_NOTE_CATEGORIES.find((category) => category.value === value)?.label ?? value;
