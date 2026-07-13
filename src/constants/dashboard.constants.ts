import { MessageCircle, Brain, Bell, CalendarCheck, TrendingUp, Heart, Sparkles } from "lucide-react";
import type { Stat, QuickAction, Activity } from "@/types/dashboard.types";

export const STATS: Stat[] = [
    { label: "Sesiones este mes", value: "6", total: "/20", icon: MessageCircle, color: "text-primary", bg: "bg-primary/10" },
    { label: "Check-ins emocionales", value: "12", icon: Heart, color: "text-success", bg: "bg-success/10" },
    { label: "Índice de bienestar", value: "78", total: "/100", icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Alertas activas", value: "3", icon: Bell, color: "text-warning", bg: "bg-warning/10" },
];

export const QUICK_ACTIONS: QuickAction[] = [
    { key: "chat", title: "Iniciar chat", desc: "Habla con tu psicólogo ahora", icon: MessageCircle, gradient: true },
    { key: "triage", title: "Triage IA", desc: "Evaluación rápida de 2 min", icon: Brain },
    { key: "specialists", title: "Ver profesionales", desc: "Equipo certificado disponible", icon: Sparkles },
    { key: "plan", title: "Mi plan", desc: "Wellness Empresa · Activo", icon: CalendarCheck },
];

export const ACTIVITIES: Activity[] = [
    { icon: MessageCircle, title: "Conversación con Dra. Camila Rojas", time: "Hoy · 10:05", color: "text-primary", bg: "bg-primary/10" },
    { icon: Brain, title: "Triage completado · Carga emocional moderada", time: "Ayer · 18:30", color: "text-accent", bg: "bg-accent/10" },
    { icon: Heart, title: "Check-in emocional registrado", time: "Ayer · 09:00", color: "text-success", bg: "bg-success/10" },
    { icon: Bell, title: "Recordatorio de respiración consciente", time: "Hace 2 días", color: "text-warning", bg: "bg-warning/10" },
];

export const WELLNESS_TIPS = [
    "Respira profundo 4-7-8: inhala 4s, retén 7s, exhala 8s.",
    "Camina 5 minutos cada 2 horas para reducir tensión.",
    "Escribe 3 cosas positivas de tu día antes de dormir.",
];
