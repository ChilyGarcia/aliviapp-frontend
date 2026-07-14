import { useEffect, useState } from "react";
import {
  ArrowRight, Clock, Activity, CalendarCheck, Sparkles, MessageCircle,
  Heart, TrendingUp, Bell, Brain, RefreshCw, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getFirstName } from "@/utils/user.utils";
import { useGreeting } from "@/hooks/use-greeting";
import { WELLNESS_TIPS } from "@/constants/dashboard.constants";
import { ACTIVITY_ICONS, dashboardService, type DashboardData } from "@/services/dashboard.service";
import type { TabKey } from "@/types/dashboard.types";

interface HomePanelProps {
  onNavigate: (key: TabKey) => void;
  userName?: string;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const QUICK_ACTIONS = [
  { key: "chat" as const, title: "Iniciar chat", desc: "Habla con tu psicólogo ahora", icon: MessageCircle, gradient: true },
  { key: "triage" as const, title: "Triage IA", desc: "Evaluación rápida de 2 min", icon: Brain },
  { key: "checkins" as const, title: "Check-in diario", desc: "Registra cómo te sientes hoy", icon: Heart },
  { key: "plan" as const, title: "Mi plan", desc: "Consulta tu plan activo", icon: CalendarCheck },
];

export const HomePanel = ({ onNavigate, userName }: HomePanelProps) => {
  const greeting = useGreeting();
  const firstName = userName ? getFirstName(userName) : "Usuario";
  const dailyTip = WELLNESS_TIPS[new Date().getDate() % WELLNESS_TIPS.length];

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const dashboard = await dashboardService.load();
      setData(dashboard);
    } catch (error) {
      setLoadError(true);
      toast({
        title: "No se pudo cargar tu panel",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando tu panel…</div>;
  }

  if (loadError || !data) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 shadow-soft text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">No pudimos cargar la información de tu panel.</p>
        <Button variant="outline" onClick={() => void loadData()}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  const { summary, usage, recentActivities, activeConversationProfessional } = data;
  const sessionsPct = usage.monthly_chat_limit > 0
    ? Math.min((usage.used_this_month / usage.monthly_chat_limit) * 100, 100)
    : 0;

  const stats = [
    {
      label: "Sesiones este mes",
      value: String(usage.used_this_month),
      total: `/${usage.monthly_chat_limit}`,
      icon: MessageCircle,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Check-ins emocionales",
      value: String(summary.total_check_ins),
      icon: Heart,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Índice de bienestar",
      value: String(summary.wellness_index),
      total: "/100",
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Racha de check-ins",
      value: String(summary.streak_days),
      total: " días",
      icon: Bell,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  const quickActions = QUICK_ACTIONS.map((action) =>
    action.key === "plan"
      ? { ...action, desc: `${usage.plan_name} · Activo` }
      : action
  );

  return (
    <div className="space-y-6">
      <div className="bg-hero text-primary-foreground rounded-3xl p-6 lg:p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <div className="flex items-center gap-2 text-sm bg-white/15 w-fit px-3 py-1.5 rounded-full mb-3">
              <Activity className="h-4 w-4 text-accent" /> Estado: {summary.emotional_state}
            </div>
            <h2 className="font-display font-extrabold text-2xl lg:text-4xl">
              {greeting}, {firstName} 👋
            </h2>
            <p className="text-white/85 mt-2 max-w-2xl">
              Tu espacio confidencial está listo.{" "}
              {summary.streak_days > 0 ? (
                <>Llevas <strong>{summary.streak_days} día{summary.streak_days !== 1 ? "s" : ""} seguidos</strong> cuidando tu bienestar emocional.</>
              ) : (
                <>Registra tu primer check-in para empezar a cuidar tu bienestar.</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button variant="secondary" size="lg" onClick={() => onNavigate("chat")}>
              <Activity className="h-4 w-4" /> Abrir chat
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => onNavigate(summary.today_check_in ? "checkins" : "checkins")}
            >
              <Heart className="h-4 w-4" /> {summary.today_check_in ? "Ver check-in" : "Hacer check-in"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 xl:p-5 shadow-soft hover:shadow-elegant transition-smooth">
            <div className={`h-10 w-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="font-display font-extrabold text-2xl text-primary">
              {s.value}<span className="text-base text-muted-foreground font-medium">{s.total ?? ""}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary text-lg">Accesos rápidos</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 xl:gap-4">
              {quickActions.map((a) => (
                <button
                  key={a.key}
                  onClick={() => onNavigate(a.key)}
                  className={`group text-left rounded-2xl p-4 xl:p-5 border transition-smooth shadow-soft hover:shadow-elegant hover:-translate-y-1 ${
                    a.gradient ? "bg-cta text-primary-foreground border-transparent" : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      a.gradient ? "bg-white/20" : "bg-primary/10 text-primary"
                    }`}>
                      <a.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className={`h-4 w-4 transition-smooth group-hover:translate-x-1 ${
                      a.gradient ? "text-white/80" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className={`font-display font-bold mt-4 ${a.gradient ? "" : "text-primary"}`}>{a.title}</div>
                  <div className={`text-sm mt-0.5 ${a.gradient ? "text-white/80" : "text-muted-foreground"}`}>{a.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary text-lg">Actividad reciente</h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("checkins")}>
                Ver todo <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-soft divide-y divide-border">
              {recentActivities.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Aún no tienes actividad registrada. Empieza con un check-in o un triage.
                </div>
              ) : (
                recentActivities.map((a) => {
                  const style = ACTIVITY_ICONS[a.kind];
                  return (
                    <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-soft transition-smooth">
                      <div className={`h-10 w-10 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}>
                        <style.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">{a.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {a.time}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card-grad border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <CalendarCheck className="h-4 w-4" /> Chat activo
            </div>
            {activeConversationProfessional ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-cta flex items-center justify-center font-bold text-primary-foreground">
                    {activeConversationProfessional.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display font-bold text-primary">{activeConversationProfessional}</div>
                    <div className="text-xs text-muted-foreground">Conversación en curso</div>
                  </div>
                </div>
                <Button variant="hero" size="sm" className="w-full mt-4" onClick={() => onNavigate("chat")}>
                  Entrar al chat
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No tienes conversaciones activas en este momento.</p>
                <Button variant="hero" size="sm" className="w-full" onClick={() => onNavigate("chat")}>
                  Iniciar chat
                </Button>
              </div>
            )}
          </div>

          <div className="bg-primary text-primary-foreground rounded-2xl p-5 shadow-soft relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Sparkles className="h-4 w-4 text-accent" /> Insight del día
              </div>
              <p className="text-white/90 text-sm leading-relaxed">{summary.insight}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Tu plan</div>
              <span className="text-[10px] bg-success/15 text-success font-bold px-2 py-0.5 rounded-full">ACTIVO</span>
            </div>
            <div className="font-display font-bold text-primary">{usage.plan_name}</div>
            <div className="text-xs text-muted-foreground">Plan de bienestar emocional</div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Sesiones</span>
                <span className="font-semibold text-primary">
                  {usage.used_this_month} / {usage.monthly_chat_limit}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-cta rounded-full" style={{ width: `${sessionsPct}%` }} />
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onNavigate("plan")}>
              Ver detalles
            </Button>
          </div>

          <div className="bg-secondary rounded-2xl p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">Tip del día:</strong> {dailyTip}
          </div>
        </div>
      </div>
    </div>
  );
};
