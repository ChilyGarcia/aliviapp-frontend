import { apiFetch } from "@/lib/api-client";
import type {
    Appointment,
    AppointmentStatus,
    AvailabilityBlock,
    AvailableSlot,
    BookAppointmentPayload,
    DateAvailabilityOverride,
    DateOverrideMode,
    DateTimeBlock,
} from "@/types/scheduling.types";

class SchedulingService {
    async getMyAvailability(): Promise<AvailabilityBlock[]> {
        return apiFetch<AvailabilityBlock[]>("/scheduling/availability/me/");
    }

    async setMyAvailability(blocks: AvailabilityBlock[]): Promise<AvailabilityBlock[]> {
        return apiFetch<AvailabilityBlock[]>("/scheduling/availability/me/", {
            method: "PUT",
            body: JSON.stringify({ blocks }),
        });
    }

    async listDateOverrides(from: string, to: string): Promise<DateAvailabilityOverride[]> {
        return apiFetch<DateAvailabilityOverride[]>(
            `/scheduling/availability/me/overrides/?from=${from}&to=${to}`
        );
    }

    async setDateOverride(
        date: string,
        mode: DateOverrideMode,
        blocks: DateTimeBlock[] = []
    ): Promise<DateAvailabilityOverride> {
        return apiFetch<DateAvailabilityOverride>(`/scheduling/availability/me/overrides/${date}/`, {
            method: "PUT",
            body: JSON.stringify({ mode, blocks }),
        });
    }

    async clearDateOverride(date: string): Promise<void> {
        return apiFetch<void>(`/scheduling/availability/me/overrides/${date}/`, {
            method: "DELETE",
        });
    }

    async listAvailableSlots(professionalId: string, date: string): Promise<AvailableSlot[]> {
        return apiFetch<AvailableSlot[]>(
            `/scheduling/availability/${professionalId}/slots/?date=${date}`
        );
    }

    async listAppointments(status?: AppointmentStatus): Promise<Appointment[]> {
        const query = status ? `?status=${status}` : "";
        return apiFetch<Appointment[]>(`/scheduling/appointments${query}`);
    }

    async bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
        return apiFetch<Appointment>("/scheduling/appointments/", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    async cancelAppointment(appointmentId: string): Promise<Appointment> {
        return apiFetch<Appointment>(`/scheduling/appointments/${appointmentId}/cancel/`, {
            method: "PATCH",
        });
    }

    async completeAppointment(appointmentId: string): Promise<Appointment> {
        return apiFetch<Appointment>(`/scheduling/appointments/${appointmentId}/complete/`, {
            method: "PATCH",
        });
    }
}

export const schedulingService = new SchedulingService();
