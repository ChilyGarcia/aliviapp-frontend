import { MessageCircle, Brain, Heart } from "lucide-react";
import { chatService } from "@/services/chat.service";
import { checkInsService } from "@/services/checkins.service";
import { triageService } from "@/services/triage.service";
import { usersService } from "@/services/users.service";
import type { ChatUsage } from "@/types/chat.types";
import type { CheckIn, CheckInSummary } from "@/types/checkin.types";
import type { TriageResult } from "@/types/triage.types";

export interface DashboardActivity {
    id: string;
    kind: "checkin" | "triage" | "chat";
    title: string;
    time: string;
    timestamp: string;
}

export interface DashboardData {
    summary: CheckInSummary;
    usage: ChatUsage;
    recentActivities: DashboardActivity[];
    latestTriage: TriageResult | null;
    activeConversationProfessional: string | null;
}

const formatRelativeTime = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const time = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

    if (diffDays === 0) return `Hoy · ${time}`;
    if (diffDays === 1) return `Ayer · ${time}`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};

const buildActivities = (
    checkIns: CheckIn[],
    triages: TriageResult[],
    conversations: { id: string; professional_id: string; started_at: string }[],
    professionalNames: Map<string, string>,
): DashboardActivity[] => {
    const items: DashboardActivity[] = [
        ...checkIns.slice(0, 5).map((item) => ({
            id: `checkin-${item.id}`,
            kind: "checkin" as const,
            title: `Check-in emocional · ${item.mood_label}`,
            time: formatRelativeTime(item.created_at),
            timestamp: item.created_at,
        })),
        ...triages.slice(0, 3).map((item) => ({
            id: `triage-${item.id}`,
            kind: "triage" as const,
            title: `Triage completado · ${item.label}`,
            time: formatRelativeTime(item.created_at),
            timestamp: item.created_at,
        })),
        ...conversations.slice(0, 3).map((item) => ({
            id: `chat-${item.id}`,
            kind: "chat" as const,
            title: `Conversación con ${professionalNames.get(item.professional_id) ?? "profesional"}`,
            time: formatRelativeTime(item.started_at),
            timestamp: item.started_at,
        })),
    ];

    return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6);
};

class DashboardService {
    async load(): Promise<DashboardData> {
        const [summary, usage, checkIns, triages, conversations] = await Promise.all([
            checkInsService.getSummary(),
            chatService.getUsage(),
            checkInsService.list(),
            triageService.getHistory(),
            chatService.listConversations(),
        ]);

        const professionalIds = [...new Set(conversations.map((c) => c.professional_id))];
        const professionals = await Promise.all(
            professionalIds.map((id) => usersService.getUserById(id).catch(() => null)),
        );
        const professionalNames = new Map(
            professionals.filter(Boolean).map((p) => [p!.id, p!.full_name]),
        );

        const activeConversation = conversations.find((c) => c.status === "ACTIVE");
        const activeConversationProfessional = activeConversation
            ? professionalNames.get(activeConversation.professional_id) ?? null
            : null;

        return {
            summary,
            usage,
            recentActivities: buildActivities(checkIns, triages, conversations, professionalNames),
            latestTriage: triages[0] ?? null,
            activeConversationProfessional,
        };
    }
}

export const dashboardService = new DashboardService();

export const ACTIVITY_ICONS = {
    checkin: { icon: Heart, color: "text-success", bg: "bg-success/10" },
    triage: { icon: Brain, color: "text-accent", bg: "bg-accent/10" },
    chat: { icon: MessageCircle, color: "text-primary", bg: "bg-primary/10" },
} as const;
