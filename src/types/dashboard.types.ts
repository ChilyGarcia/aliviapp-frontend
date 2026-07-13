import type { LucideIcon } from "lucide-react";

export interface Stat {
    label: string;
    value: string;
    total?: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}

export interface QuickAction {
    key: "chat" | "triage" | "alerts" | "specialists" | "plan" | "profile";
    title: string;
    desc: string;
    icon: LucideIcon;
    gradient?: boolean;
}

export interface Activity {
    icon: LucideIcon;
    title: string;
    time: string;
    color: string;
    bg: string;
}

export type TabKey = "home" | "chat" | "checkins" | "triage" | "library" | "alerts" | "specialists" | "plan" | "profile";
