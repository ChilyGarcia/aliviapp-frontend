import { apiFetch } from "@/lib/api-client";
import type { CheckIn, CheckInSummary, CreateCheckInPayload } from "@/types/checkin.types";

class CheckInsService {
    async list(): Promise<CheckIn[]> {
        return apiFetch<CheckIn[]>("/check-ins/");
    }

    async create(payload: CreateCheckInPayload): Promise<CheckIn> {
        return apiFetch<CheckIn>("/check-ins/", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }

    async getSummary(): Promise<CheckInSummary> {
        return apiFetch<CheckInSummary>("/check-ins/summary/");
    }
}

export const checkInsService = new CheckInsService();
