export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type AppointmentModality = "chat" | "video" | "audio";

export type DateOverrideMode = "recurring" | "unavailable" | "custom";

export interface DateTimeBlock {
    start_time: string;
    end_time: string;
}

export interface DateAvailabilityOverride {
    date: string;
    mode: DateOverrideMode;
    blocks: DateTimeBlock[];
}

export interface AvailabilityBlock {
    day_of_week: number;
    start_time: string;
    end_time: string;
}

export interface AvailableSlot {
    scheduled_at: string;
}

export interface Appointment {
    id: string;
    patient_id: string;
    professional_id: string;
    patient_name: string;
    professional_name: string;
    scheduled_at: string;
    topic: string;
    notes: string;
    modality: AppointmentModality;
    reminder_minutes: number;
    status: AppointmentStatus;
    created_at: string;
    completed_at: string | null;
}

export interface BookAppointmentPayload {
    professional_id: string;
    scheduled_at: string;
    topic: string;
    notes?: string;
    modality: AppointmentModality;
    reminder_minutes: number;
}
