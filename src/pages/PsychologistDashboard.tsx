import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ProfessionalAgendaPanel } from "@/components/dashboard/ProfessionalAgendaPanel";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import {
  ChatAppointmentReminder,
  hasUpcomingAppointment,
} from "@/components/dashboard/ChatAppointmentReminder";
import { ChatMessageBubble } from "@/components/dashboard/ChatMessageBubble";
import { TriageResultDialog } from "@/components/dashboard/TriageResultDialog";
import { useAuth } from "@/hooks/use-auth";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { getUserInitials } from "@/utils/user.utils";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { chatService } from "@/services/chat.service";
import { schedulingService } from "@/services/scheduling.service";
import { triageService } from "@/services/triage.service";
import {
  professionalInsightsService,
  ratingsService,
  type PatientTriageAlert,
} from "@/services/ratings.service";
import { usersService } from "@/services/users.service";
import type { User as AuthUser } from "@/types/auth.types";
import type { Conversation, Message, TriageReplyDraft } from "@/types/chat.types";
import type {
  ProfessionalMetrics,
  ProfessionalRatingSummary,
} from "@/types/ratings.types";
import type { Appointment } from "@/types/scheduling.types";
import type { TriageResult } from "@/types/triage.types";
import {
  LayoutDashboard,
  MessageCircle,
  Calendar,
  AlertTriangle,
  Users,
  FileText,
  User,
  ArrowLeft,
  Menu,
  X,
  Brain,
  Clock,
  CheckCircle2,
  Search,
  Send,
  Plus,
  Filter,
  Star,
  Heart,
  ShieldAlert,
  Phone,
  Video,
  MoreVertical,
  Download,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Pencil,
  Save,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey =
  | "overview"
  | "inbox"
  | "agenda"
  | "alerts"
  | "patients"
  | "notes"
  | "profile";

const baseTabs: { key: TabKey; label: string; icon: typeof MessageCircle }[] = [
  { key: "overview", label: "Resumen", icon: LayoutDashboard },
  { key: "inbox", label: "Bandeja de chats", icon: MessageCircle },
  { key: "agenda", label: "Agenda", icon: Calendar },
  { key: "alerts", label: "Alertas críticas", icon: AlertTriangle },
  { key: "patients", label: "Pacientes", icon: Users },
  { key: "notes", label: "Notas clínicas", icon: FileText },
  { key: "profile", label: "Perfil profesional", icon: User },
];

const seenAppointmentsKey = (userId: string) => `aliviapp_pro_appointments_seen_${userId}`;

const getSeenAppointmentIds = (userId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(seenAppointmentsKey(userId));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
};

const markAppointmentsSeen = (userId: string, ids: string[]) => {
  const seen = getSeenAppointmentIds(userId);
  ids.forEach((id) => seen.add(id));
  localStorage.setItem(seenAppointmentsKey(userId), JSON.stringify([...seen]));
};

const formatAppointmentTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });

const formatAppointmentDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const getWeekStart = (reference = new Date()) => {
  const date = new Date(reference);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ---------- OVERVIEW ---------- */
const isPeriodActiveConversation = (conversation: Conversation) =>
  conversation.status === "ACTIVE" &&
  Boolean(conversation.period_active) &&
  Boolean(conversation.expires_at) &&
  new Date(conversation.expires_at) > new Date();

const isOpenConversation = (conversation: Conversation) => conversation.status === "ACTIVE";

const dayGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

const TRIAGE_LEVEL_STYLES: Record<string, string> = {
  URGENT: "bg-destructive/10 text-destructive border-destructive/20",
  PRIORITY: "bg-warning/10 text-warning border-warning/20",
  PREVENTIVE: "bg-primary/10 text-primary border-primary/20",
  STABLE: "bg-success/10 text-success border-success/20",
};

/** Buckets alineados con el backend: días 1–7, 8–14, 15–21, 22–28, 29–fin. */
const monthWeekRanges = (reference = new Date()) => {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthShort = reference.toLocaleDateString("es-CO", { month: "short" });

  const buckets = [
    [1, Math.min(7, daysInMonth)],
    [8, Math.min(14, daysInMonth)],
    [15, Math.min(21, daysInMonth)],
    [22, Math.min(28, daysInMonth)],
    [29, daysInMonth],
  ] as const;

  return buckets
    .filter(([start]) => start <= daysInMonth)
    .map(([start, end], index) => ({
      shortLabel: `Sem ${index + 1}`,
      daysLabel: `${start}–${end}`,
      label: `${start}–${end} ${monthShort}`,
    }));
};

const OverviewPanel = ({
  onNavigate,
  onOpenPatientChat,
  appointments,
  newAppointmentIds,
}: {
  onNavigate: (k: TabKey) => void;
  onOpenPatientChat: (patientId: string, triageReply?: TriageReplyDraft) => void;
  appointments: Appointment[];
  newAppointmentIds: Set<string>;
}) => {
  const { user } = useAuth();
  const [activeChats, setActiveChats] = useState<Conversation[]>([]);
  const [metrics, setMetrics] = useState<ProfessionalMetrics | null>(null);
  const [triageAlerts, setTriageAlerts] = useState<PatientTriageAlert[]>([]);
  const [summary, setSummary] = useState<ProfessionalRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTriage, setSelectedTriage] = useState<PatientTriageAlert | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [conversations, metricsResult, triageResult, summaryResult] = await Promise.all([
          chatService.listConversations(),
          ratingsService.getMyMetrics(),
          professionalInsightsService.listContactedPatientsTriage(),
          ratingsService.getMySummary(),
        ]);
        if (cancelled) return;

        const active = conversations.filter(isOpenConversation);
        const activePatientIds = new Set(active.map((c) => c.patient_id));

        setActiveChats(active);
        setMetrics(metricsResult);
        setSummary(summaryResult);
        setTriageAlerts(triageResult.filter((alert) => activePatientIds.has(alert.patient_id)));
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "No se pudo cargar el resumen",
            description: error instanceof Error ? error.message : "Intenta de nuevo",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = [...appointments]
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  const sessionsToday = appointments.filter((a) =>
    isSameDay(new Date(a.scheduled_at), new Date())
  ).length;

  const satisfaction =
    metrics && metrics.total_ratings > 0 ? metrics.average_score.toFixed(1) : "—";

  const maxWeek = metrics
    ? Math.max(...metrics.sessions_by_week.map((item) => item.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      {newAppointmentIds.size > 0 && (
        <div className="bg-success/10 border border-success/30 rounded-2xl p-4 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">
              {newAppointmentIds.size === 1
                ? "Un paciente agendó una nueva cita contigo"
                : `${newAppointmentIds.size} pacientes agendaron nuevas citas contigo`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Revisa tu calendario en la pestaña Agenda para ver los detalles.
            </p>
          </div>
          <Button variant="hero" size="sm" onClick={() => onNavigate("agenda")}>
            Ver calendario
          </Button>
        </div>
      )}

      <div className="bg-gradient-to-br from-primary to-primary-deep rounded-3xl p-6 lg:p-8 text-primary-foreground shadow-elegant">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0 max-w-2xl">
            <p className="text-primary-foreground/80 text-sm">{dayGreeting()}</p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold">
              {user?.full_name ?? "Profesional"}
            </h2>
            <p className="text-primary-foreground/80 text-sm mt-1">
              {user?.email ?? "Panel profesional · AliviApp"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-sm font-medium">
              {loading ? "Cargando…" : activeChats.length > 0 ? "Chats activos" : "Sin chats activos"}
            </span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
          {[
            {
              label: "Chats activos",
              value: loading ? "…" : String(activeChats.length),
              icon: MessageCircle,
            },
            { label: "Citas hoy", value: String(sessionsToday), icon: Calendar },
            { label: "Citas próximas", value: String(appointments.length), icon: AlertTriangle },
            { label: "Satisfacción", value: loading ? "…" : satisfaction, icon: Star },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-3 xl:p-4 border border-white/15">
              <s.icon className="h-4 w-4 mb-1 opacity-80" />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 xl:gap-6">
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-soft border border-border p-5 xl:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-primary">Próximas citas</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("agenda")}>
              Ver agenda
            </Button>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No tienes citas agendadas por pacientes.
              </p>
            ) : (
              upcoming.map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-2xl bg-soft hover:bg-secondary transition-smooth">
                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[3.25rem] px-2 py-2.5 rounded-2xl bg-primary/10 text-primary gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="text-xs font-bold tabular-nums leading-none whitespace-nowrap">
                      {formatAppointmentTime(session.scheduled_at)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {session.patient_name}
                      {newAppointmentIds.has(session.id) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">NUEVA</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.topic} · {formatAppointmentDate(session.scheduled_at)}
                    </div>
                  </div>
                  <Button variant="hero" size="sm" onClick={() => onNavigate("agenda")}>
                    Ver
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-cta" />
              <h3 className="font-display font-bold text-primary">Triage IA</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("inbox")}>
              Chats
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Pacientes con chat activo priorizados por riesgo emocional. Toca uno para ver el detalle.
          </p>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Cargando triage…</p>
            ) : triageAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No hay triage de pacientes con chat activo.
              </p>
            ) : (
              triageAlerts.map((alert) => (
                <button
                  key={alert.patient_id}
                  type="button"
                  onClick={() => setSelectedTriage(alert)}
                  className="w-full text-left rounded-2xl border border-border bg-soft/70 p-3 hover:bg-secondary transition-smooth"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {alert.patient_name}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                        TRIAGE_LEVEL_STYLES[alert.triage.level] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {alert.triage.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">
                    Carga emocional: {alert.triage.percentage}%
                  </p>
                  <p className="text-[11px] text-foreground/80 line-clamp-2">{alert.triage.advice}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <TriageResultDialog
        open={Boolean(selectedTriage)}
        onOpenChange={(open) => !open && setSelectedTriage(null)}
        triage={selectedTriage?.triage ?? null}
        title={selectedTriage ? `Triage de ${selectedTriage.patient_name}` : "Detalle del triage"}
        footer={
          selectedTriage ? (
            <>
              <Button variant="outline" onClick={() => setSelectedTriage(null)}>
                Cerrar
              </Button>
              <Button
                variant="hero"
                onClick={() => {
                  const draft: TriageReplyDraft = {
                    triage_assessment_id: selectedTriage.triage.id,
                    triage_label: selectedTriage.triage.label,
                  };
                  const patientId = selectedTriage.patient_id;
                  setSelectedTriage(null);
                  onOpenPatientChat(patientId, draft);
                }}
              >
                Responder en el chat
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
          <div className="mb-1">
            <h3 className="font-display font-bold text-primary">Citas este mes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Por semana del calendario · sin canceladas
              {metrics ? ` · total ${metrics.sessions_this_month}` : ""}
            </p>
          </div>
          {loading || !metrics ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Cargando gráfica…</p>
          ) : metrics.sessions_by_week.every((item) => item.count === 0) ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Aún no hay citas registradas este mes.
            </p>
          ) : (
            (() => {
              const weeks = monthWeekRanges(new Date());
              const scaleMax = Math.max(maxWeek, 3);
              const ticks = Array.from({ length: scaleMax + 1 }, (_, i) => scaleMax - i);

              return (
                <div className="mt-4">
                  <div className="relative h-52 pl-7">
                    <div className="absolute inset-0 left-7 right-0 top-1 bottom-7 pointer-events-none">
                      {ticks.map((tick) => (
                        <div
                          key={tick}
                          className="absolute left-0 right-0 border-t border-border/60"
                          style={{ bottom: `${(tick / scaleMax) * 100}%` }}
                        >
                          <span className="absolute -left-7 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground w-5 text-right">
                            {tick}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="absolute left-7 right-0 top-1 bottom-7 flex items-end gap-2 sm:gap-3">
                      {metrics.sessions_by_week.map((item, index) => {
                        const range = weeks[index];
                        const heightPct = item.count === 0 ? 0 : (item.count / scaleMax) * 100;
                        return (
                          <div
                            key={item.label}
                            className="relative flex-1 h-full min-w-0 flex items-end justify-center"
                            title={range ? `${range.label}: ${item.count} cita${item.count === 1 ? "" : "s"}` : undefined}
                          >
                            {item.count > 0 && (
                              <span
                                className="absolute left-1/2 -translate-x-1/2 text-[11px] font-semibold text-foreground tabular-nums"
                                style={{ bottom: `calc(${heightPct}% + 4px)` }}
                              >
                                {item.count}
                              </span>
                            )}
                            <div
                              className={cn(
                                "w-full max-w-[2.75rem] rounded-t-lg",
                                item.count > 0 ? "bg-cta" : "bg-transparent"
                              )}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute left-7 right-0 bottom-0 flex gap-2 sm:gap-3">
                      {metrics.sessions_by_week.map((item, index) => {
                        const range = weeks[index];
                        return (
                          <div key={item.label} className="flex-1 min-w-0 text-center">
                            <p className="text-[10px] font-semibold text-foreground truncate">
                              {range?.shortLabel ?? item.label}
                            </p>
                            <p className="text-[9px] text-muted-foreground truncate hidden sm:block">
                              {range?.daysLabel}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                    {metrics.sessions_by_week.map((item, index) => {
                      const range = weeks[index];
                      if (!range || item.count === 0) return null;
                      return (
                        <div
                          key={`${item.label}-detail`}
                          className="flex items-center justify-between text-xs gap-2"
                        >
                          <span className="text-muted-foreground truncate">{range.label}</span>
                          <span className="font-semibold text-foreground tabular-nums shrink-0">
                            {item.count} cita{item.count === 1 ? "" : "s"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </div>

        <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
          <h3 className="font-display font-bold text-primary mb-4">Motivos de consulta</h3>
          {loading || !metrics ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Cargando…</p>
          ) : metrics.top_topics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Los temas aparecerán cuando tengas citas agendadas.
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.top_topics.map((topic) => (
                <div key={topic.label}>
                  <div className="flex justify-between text-xs mb-1 gap-2">
                    <span className="font-medium truncate">{topic.label}</span>
                    <span className="text-muted-foreground shrink-0">
                      {topic.percentage}% · {topic.count}
                    </span>
                  </div>
                  <div className="h-2 bg-soft rounded-full overflow-hidden">
                    <div className="h-full bg-cta rounded-full" style={{ width: `${topic.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-primary">Reseñas recientes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary && summary.total_ratings > 0
                ? `Promedio ${summary.average_score.toFixed(1)} · ${summary.total_ratings} reseña${summary.total_ratings === 1 ? "" : "s"}`
                : "Aún sin calificaciones de pacientes"}
            </p>
          </div>
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando reseñas…</p>
        ) : !summary || summary.recent_ratings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Aparecerán cuando pacientes con conversación activa te evalúen.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {summary.recent_ratings.map((rating) => (
              <div key={rating.id} className="rounded-2xl border border-border bg-soft/70 p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm text-foreground">{rating.patient_name}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={cn(
                          "h-3.5 w-3.5",
                          value <= rating.score
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {rating.comment ? (
                  <p className="text-xs text-muted-foreground line-clamp-3">{rating.comment}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Sin comentario</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- INBOX ---------- */
const INBOX_AVATAR_COLORS = ["bg-cta", "bg-primary", "bg-accent", "bg-primary-deep"];

const inboxAvatarColor = (id: string) => {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return INBOX_AVATAR_COLORS[sum % INBOX_AVATAR_COLORS.length];
};

const inboxInitials = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

const inboxTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const inboxErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const InboxPanel = ({
  appointments,
  initialPatientId = null,
  triageReplyDraft = null,
  onTargetHandled,
  onTriageReplyHandled,
}: {
  appointments: Appointment[];
  initialPatientId?: string | null;
  triageReplyDraft?: TriageReplyDraft | null;
  onTargetHandled?: () => void;
  onTriageReplyHandled?: () => void;
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [patients, setPatients] = useState<Record<string, AuthUser>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeTriageReply, setActiveTriageReply] = useState<TriageReplyDraft | null>(null);
  const [triageDetail, setTriageDetail] = useState<TriageResult | null>(null);
  const [triageDetailOpen, setTriageDetailOpen] = useState(false);
  const [triageDetailLoading, setTriageDetailLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const pendingPatientIdRef = useRef<string | null>(initialPatientId);

  useEffect(() => {
    pendingPatientIdRef.current = initialPatientId;
    if (triageReplyDraft) {
      setActiveTriageReply(triageReplyDraft);
    }
  }, [initialPatientId, triageReplyDraft]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingConversations(true);
      try {
        const list = await chatService.listConversations();
        if (cancelled) return;
        setConversations(list);

        const uniqueIds = Array.from(new Set(list.map((c) => c.patient_id)));
        const resolved = await Promise.all(uniqueIds.map((id) => usersService.getUserById(id)));
        if (cancelled) return;
        setPatients((prev) => ({ ...prev, ...Object.fromEntries(resolved.map((u) => [u.id, u])) }));

        if (list.length > 0 && !pendingPatientIdRef.current) {
          setActiveId(list[0].id);
        }
      } catch (error) {
        toast({
          title: "No se pudo cargar la bandeja",
          description: inboxErrorMessage(error, "Intenta de nuevo más tarde"),
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initialPatientId || conversations.length === 0) return;

    const targetConversation =
      conversations.find(
        (c) =>
          c.patient_id === initialPatientId &&
          c.status === "ACTIVE" &&
          (c.expires_at ? new Date(c.expires_at) > new Date() : false)
      ) ?? conversations.find((c) => c.patient_id === initialPatientId);

    if (targetConversation) {
      setActiveId(targetConversation.id);
      pendingPatientIdRef.current = null;
      onTargetHandled?.();
      return;
    }

    toast({
      title: "No hay chat activo con ese paciente",
      description: "Se abrió la bandeja con tus conversaciones disponibles.",
      variant: "destructive",
    });
    pendingPatientIdRef.current = null;
    onTargetHandled?.();
  }, [initialPatientId, conversations, onTargetHandled]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const list = await chatService.listMessages(activeId);
        if (!cancelled) setMessages(list);
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "No se pudieron cargar los mensajes",
            description: inboxErrorMessage(error, "Intenta de nuevo más tarde"),
            variant: "destructive",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const handleIncoming = useCallback((message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  const openTriageDetail = useCallback(async (assessmentId: string) => {
    setTriageDetailOpen(true);
    setTriageDetailLoading(true);
    setTriageDetail(null);
    try {
      const result = await triageService.getById(assessmentId);
      setTriageDetail(result);
    } catch (error) {
      setTriageDetailOpen(false);
      toast({
        title: "No se pudo cargar el triage",
        description: inboxErrorMessage(error, "Intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setTriageDetailLoading(false);
    }
  }, []);

  const { connected, isPeerTyping, sendMessage: wsSend, sendTyping } = useChatSocket(activeId, handleIncoming);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPeerTyping]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activePatient = active ? patients[active.patient_id] : undefined;
  const isClosed = active
    ? active.status !== "ACTIVE"
    : false;
  const periodActive = active
    ? Boolean(active.period_active) && Boolean(active.expires_at) && new Date(active.expires_at) > new Date()
    : false;
  const standby = Boolean(active && active.status === "ACTIVE" && !periodActive);

  const handleInputChange = (value: string) => {
    setInput(value);
    const now = Date.now();
    if (connected && !isClosed && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      sendTyping();
    }
  };

  const send = async () => {
    const content = input.trim();
    if (!content || !activeId || isClosed) return;
    setInput("");

    const metadata = activeTriageReply
      ? {
        context: "triage_reply" as const,
        triage_assessment_id: activeTriageReply.triage_assessment_id,
        triage_label: activeTriageReply.triage_label,
      }
      : undefined;

    if (connected) {
      wsSend(content, metadata);
      setActiveTriageReply(null);
      onTriageReplyHandled?.();
      return;
    }

    try {
      const message = await chatService.sendMessage(activeId, content, metadata);
      setMessages((prev) => [...prev, message]);
      setActiveTriageReply(null);
      onTriageReplyHandled?.();
    } catch (error) {
      toast({
        title: "No se pudo enviar el mensaje",
        description: inboxErrorMessage(error, "Intenta de nuevo"),
        variant: "destructive",
      });
    }
  };

  const filtered = conversations.filter((c) =>
    (patients[c.patient_id]?.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-card rounded-3xl shadow-soft border border-border h-[calc(100vh-10rem)] flex overflow-hidden">
      <div className="w-72 border-r border-border flex flex-col bg-soft shrink-0 hidden md:flex">
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-primary">Bandeja</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full bg-secondary rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConversations && (
            <p className="text-xs text-muted-foreground text-center p-4">Cargando…</p>
          )}
          {!loadingConversations && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center p-4">
              Aún no tienes conversaciones asignadas.
            </p>
          )}
          {filtered.map((c) => {
            const name = patients[c.patient_id]?.full_name ?? "Paciente";
            const expired = c.status !== "ACTIVE";
            const cStandby = c.status === "ACTIVE" && !(c.period_active && c.expires_at && new Date(c.expires_at) > new Date());
            const hasAppointment = hasUpcomingAppointment(appointments, c.patient_id, "patient_id");
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center gap-3 border-l-4 transition-smooth",
                  activeId === c.id ? "bg-card border-primary" : "border-transparent hover:bg-card"
                )}
              >
                <div className="relative shrink-0">
                  <div className={`h-11 w-11 rounded-full ${inboxAvatarColor(c.id)} flex items-center justify-center font-bold text-primary-foreground text-sm`}>
                    {inboxInitials(name)}
                  </div>
                  {!expired && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-card" />}
                  {hasAppointment && (
                    <span className="absolute -top-0.5 -left-0.5 h-3.5 w-3.5 rounded-full bg-cta ring-2 ring-card flex items-center justify-center">
                      <Calendar className="h-2 w-2 text-primary-foreground" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-1">
                    <div className="font-semibold text-sm text-foreground truncate">{name}</div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{inboxTime(c.started_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{expired ? "Chat cerrado" : cStandby ? "En espera · periodo vencido" : "Chat activo"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
            {loadingConversations ? "Cargando…" : "Selecciona una conversación de la bandeja."}
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full ${inboxAvatarColor(active.id)} flex items-center justify-center font-bold text-primary-foreground`}>
                  {inboxInitials(activePatient?.full_name ?? "P")}
                </div>
                <div>
                  <div className="font-display font-bold text-primary">{activePatient?.full_name ?? "Paciente"}</div>
                  <div className="text-xs text-muted-foreground">
                    {isClosed
                      ? "Chat cerrado"
                      : standby
                        ? "Periodo en espera (el paciente debe enviar para renovar)"
                        : isPeerTyping
                          ? "Escribiendo…"
                          : connected
                            ? "En línea · conectado"
                            : "Conectando…"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activePatient && (
                  <ChatAppointmentReminder
                    appointments={appointments}
                    participantId={active.patient_id}
                    participantName={activePatient.full_name}
                    matchField="patient_id"
                  />
                )}
                <Button variant="ghost" size="icon" disabled><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-soft">
              {messages.map((m) => (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  isOwn={m.sender_id === user?.id}
                  onOpenTriage={openTriageDetail}
                />
              ))}
              {isPeerTyping && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-4 border-t border-border bg-card">
              {isClosed && (
                <p className="text-xs text-destructive text-center mb-2">Este chat ya finalizó.</p>
              )}
              {activeTriageReply && !isClosed && (
                <div className="mb-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">Respondiendo sobre triage</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {activeTriageReply.triage_label}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => {
                      setActiveTriageReply(null);
                      onTriageReplyHandled?.();
                    }}
                    aria-label="Cancelar respuesta de triage"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  disabled={isClosed}
                  placeholder={
                    activeTriageReply
                      ? "Escribe tu orientación sobre el triage…"
                      : "Escribe una respuesta profesional…"
                  }
                  className="flex-1 bg-transparent outline-none text-sm py-2 disabled:opacity-50"
                />
                <Button variant="hero" size="icon" onClick={send} disabled={isClosed} className="rounded-xl shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">🔒 Conversación confidencial</p>
            </div>
          </>
        )}
      </div>

      <TriageResultDialog
        open={triageDetailOpen}
        onOpenChange={setTriageDetailOpen}
        triage={triageDetail}
        loading={triageDetailLoading}
        title={
          activePatient
            ? `Triage de ${activePatient.full_name}`
            : "Detalle del triage"
        }
      />
    </div>
  );
};

/* ---------- AGENDA ---------- */
const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const AgendaPanel = ({
  appointments,
  onAppointmentsChange,
  newAppointmentIds,
}: {
  appointments: Appointment[];
  onAppointmentsChange: (next: Appointment[]) => void;
  newAppointmentIds: Set<string>;
}) => {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getWeekStart());

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const availability = await schedulingService.getMyAvailability();
      setBlocks(availability);
    } catch (error) {
      toast({
        title: "No se pudo cargar la agenda",
        description: inboxErrorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const appointmentsByDay = weekDays.map((day) =>
    appointments
      .filter((a) => isSameDay(new Date(a.scheduled_at), day))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  );

  const weekRangeLabel = `${weekDays[0].toLocaleDateString("es-CO", { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`;

  const addBlock = (dayOfWeek: number) => {
    setBlocks((prev) => [
      ...prev,
      { day_of_week: dayOfWeek, start_time: "09:00", end_time: "12:00" },
    ]);
  };

  const updateBlock = (
    index: number,
    field: keyof AvailabilityBlock,
    value: string | number
  ) => {
    setBlocks((prev) =>
      prev.map((block, i) => (i === index ? { ...block, [field]: value } : block))
    );
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const saved = await schedulingService.setMyAvailability(blocks);
      setBlocks(saved);
      toast({
        title: "Disponibilidad guardada",
        description: "Los pacientes ya pueden agendar en tus horarios.",
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: inboxErrorMessage(error, "Revisa los horarios e intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const completeAppointment = async (appointmentId: string) => {
    try {
      await schedulingService.completeAppointment(appointmentId);
      onAppointmentsChange(appointments.filter((a) => a.id !== appointmentId));
      toast({ title: "Sesión marcada como completada" });
    } catch (error) {
      toast({
        title: "No se pudo completar la sesión",
        description: inboxErrorMessage(error, "Intenta de nuevo"),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-3xl shadow-soft border border-border p-8 text-center text-muted-foreground">
        Cargando agenda…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {newAppointmentIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-foreground flex-1">
            Tienes <strong>{newAppointmentIds.size}</strong>{" "}
            {newAppointmentIds.size === 1 ? "cita nueva" : "citas nuevas"} agendadas por pacientes.
          </p>
        </div>
      )}

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h3 className="font-display font-bold text-primary text-lg">Calendario semanal</h3>
            <p className="text-xs text-muted-foreground">
              Semana del {weekRangeLabel} · {appointments.length} citas programadas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prev = new Date(weekStart);
                prev.setDate(prev.getDate() - 7);
                setWeekStart(prev);
              }}
            >
              ← Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(getWeekStart())}>
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(next);
              }}
            >
              Siguiente →
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const dayAppointments = appointmentsByDay[index];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-2xl border p-3 min-h-[140px]",
                  isToday ? "border-primary bg-primary/5" : "border-border bg-soft/40"
                )}
              >
                <div className="text-center mb-3">
                  <div className="text-xs font-bold uppercase text-muted-foreground">
                    {DAY_LABELS[index].slice(0, 3)}
                  </div>
                  <div className={cn("text-lg font-bold", isToday && "text-primary")}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayAppointments.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center">Sin citas</p>
                  ) : (
                    dayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className={cn(
                          "rounded-xl border px-2 py-1.5 text-xs",
                          newAppointmentIds.has(appointment.id)
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-primary/10 border-primary/20 text-primary"
                        )}
                      >
                        <div className="font-bold">{formatAppointmentTime(appointment.scheduled_at)}</div>
                        <div className="truncate">{appointment.patient_name}</div>
                        <div className="truncate opacity-80">{appointment.topic}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h3 className="font-display font-bold text-primary text-lg">Disponibilidad semanal</h3>
            <p className="text-xs text-muted-foreground">
              Define los bloques en los que los pacientes pueden agendar citas de 60 minutos.
            </p>
          </div>
          <Button variant="hero" size="sm" onClick={saveAvailability} disabled={saving}>
            {saving ? "Guardando…" : "Guardar disponibilidad"}
          </Button>
        </div>

        <div className="space-y-4">
          {DAY_LABELS.map((label, dayIndex) => {
            const dayBlocks = blocks
              .map((block, index) => ({ block, index }))
              .filter(({ block }) => block.day_of_week === dayIndex);

            return (
              <div key={label} className="rounded-2xl border border-border p-4 bg-soft/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{label}</h4>
                  <Button variant="outline" size="sm" onClick={() => addBlock(dayIndex)}>
                    <Plus className="h-4 w-4" /> Agregar bloque
                  </Button>
                </div>

                {dayBlocks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin horarios configurados.</p>
                ) : (
                  <div className="space-y-2">
                    {dayBlocks.map(({ block, index }) => (
                      <div key={`${dayIndex}-${index}`} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={block.start_time}
                          onChange={(e) => updateBlock(index, "start_time", e.target.value)}
                          className="bg-card rounded-xl px-3 py-2 text-sm border border-border outline-none"
                        />
                        <span className="text-muted-foreground text-sm">a</span>
                        <input
                          type="time"
                          value={block.end_time}
                          onChange={(e) => updateBlock(index, "end_time", e.target.value)}
                          className="bg-card rounded-xl px-3 py-2 text-sm border border-border outline-none"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeBlock(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-primary text-lg">Citas agendadas</h3>
          <span className="text-xs text-muted-foreground">{appointments.length} próximas</span>
        </div>

        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aún no tienes citas agendadas por pacientes.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-soft border border-border"
              >
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[3.25rem] px-2 py-2.5 rounded-2xl bg-primary/10 text-primary gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="text-xs font-bold tabular-nums leading-none whitespace-nowrap">
                    {formatAppointmentTime(appointment.scheduled_at)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    {appointment.patient_name}
                    {newAppointmentIds.has(appointment.id) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">
                        NUEVA
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.topic} · {formatAppointmentDate(appointment.scheduled_at)}
                  </div>
                  {appointment.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{appointment.notes}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => completeAppointment(appointment.id)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Completar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- ALERTS ---------- */
const AlertsPanel = () => (
  <div className="space-y-4">
    {[
      { name: "Sofía López", company: "Nova S.A.", reason: "Triage IA detectó lenguaje de alto riesgo emocional. Insomnio + ansiedad sostenida.", level: "Crítica", time: "Hace 12 min", color: "border-destructive bg-destructive/5" },
      { name: "Mateo Ruiz", company: "Acme Corp", reason: "3 check-ins con estado emocional bajo en la última semana.", level: "Atención", time: "Hace 2 h", color: "border-amber-500 bg-amber-50" },
      { name: "Juan Castro", company: "Nova S.A.", reason: "Solicitó sesión preparada con anticipación.", level: "Programada", time: "Ayer", color: "border-primary bg-primary/5" },
    ].map((a, i) => (
      <div key={i} className={`border-l-4 rounded-2xl p-5 ${a.color} bg-card border border-border shadow-soft`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="text-xs font-bold uppercase tracking-wide">{a.level}</span>
              <span className="text-xs text-muted-foreground">· {a.time}</span>
            </div>
            <h4 className="font-display font-bold text-primary text-lg">{a.name}</h4>
            <p className="text-xs text-muted-foreground mb-1">{a.company}</p>
            <p className="text-sm text-foreground/80">{a.reason}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Ver perfil</Button>
            <Button variant="hero" size="sm"><MessageCircle className="h-4 w-4" /> Atender</Button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ---------- PATIENTS ---------- */
const PatientsPanel = () => {
  const patients = [
    { name: "Daniel Morales", company: "Acme Corp", sessions: 8, last: "Hoy", status: "Activo", risk: "Bajo" },
    { name: "Sofía López", company: "Nova S.A.", sessions: 3, last: "Hoy", status: "Activo", risk: "Alto" },
    { name: "Mateo Ruiz", company: "Acme Corp", sessions: 12, last: "Ayer", status: "Activo", risk: "Medio" },
    { name: "Lucía Patiño", company: "Vértice", sessions: 5, last: "3 días", status: "Activo", risk: "Bajo" },
    { name: "Juan Castro", company: "Nova S.A.", sessions: 2, last: "1 sem", status: "Pausa", risk: "Bajo" },
    { name: "Ana García", company: "Acme Corp", sessions: 15, last: "2 sem", status: "Alta", risk: "Bajo" },
  ];
  return (
    <div className="bg-card rounded-3xl shadow-soft border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-primary">Pacientes asignados</h3>
          <p className="text-xs text-muted-foreground">47 activos · 12 en seguimiento · 8 dados de alta</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar..." className="bg-secondary rounded-xl pl-9 pr-3 py-2 text-sm outline-none" />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filtrar</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-soft text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-5 py-3">Paciente</th>
              <th className="text-left px-5 py-3">Empresa</th>
              <th className="text-left px-5 py-3">Sesiones</th>
              <th className="text-left px-5 py-3">Última</th>
              <th className="text-left px-5 py-3">Estado</th>
              <th className="text-left px-5 py-3">Riesgo</th>
              <th className="text-right px-5 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.name} className="border-t border-border hover:bg-soft transition-smooth">
                <td className="px-5 py-3 font-semibold">{p.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.company}</td>
                <td className="px-5 py-3">{p.sessions}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.last}</td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    p.status === "Activo" ? "bg-success/10 text-success" :
                      p.status === "Pausa" ? "bg-amber-500/10 text-amber-700" :
                        "bg-muted text-muted-foreground"
                  )}>{p.status}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold text-white",
                    p.risk === "Alto" ? "bg-destructive" : p.risk === "Medio" ? "bg-amber-500" : "bg-success"
                  )}>{p.risk}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Button variant="ghost" size="sm">Ver</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- NOTES ---------- */
const NotesPanel = () => {
  const [selected, setSelected] = useState(0);
  const notes = [
    { patient: "Sofía López", date: "30 abr 2026", title: "Sesión inicial · Insomnio y ansiedad", tags: ["Ansiedad", "Sueño"] },
    { patient: "Daniel Morales", date: "29 abr 2026", title: "Seguimiento · Carga laboral", tags: ["Estrés laboral"] },
    { patient: "Mateo Ruiz", date: "28 abr 2026", title: "Técnicas de regulación emocional", tags: ["TCC"] },
  ];
  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-10rem)]">
      <div className="bg-card rounded-3xl shadow-soft border border-border p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-primary">Notas clínicas</h3>
          <Button variant="hero" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          {notes.map((n, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "w-full text-left p-3 rounded-2xl border transition-smooth",
                selected === i ? "bg-primary/5 border-primary" : "bg-soft border-transparent hover:bg-secondary"
              )}
            >
              <div className="font-semibold text-sm">{n.patient}</div>
              <div className="text-xs text-muted-foreground truncate">{n.title}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{n.date}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-3xl shadow-soft border border-border p-6 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <h2 className="font-display font-bold text-primary text-xl">{notes[selected].title}</h2>
            <p className="text-xs text-muted-foreground">{notes[selected].patient} · {notes[selected].date}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Exportar</Button>
            <Button variant="hero" size="sm">Guardar</Button>
          </div>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {notes[selected].tags.map((t) => (
            <span key={t} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
          ))}
        </div>
        <textarea
          defaultValue={`Motivo de consulta:\nPaciente refiere insomnio recurrente desde hace 2 semanas, asociado a sobrecarga laboral.\n\nObservaciones:\n- Discurso coherente, afecto ansioso.\n- Refiere rumiación nocturna.\n\nPlan terapéutico:\n1. Higiene del sueño.\n2. Técnica de respiración 4-7-8.\n3. Diario emocional diario.\n\nPróxima sesión: 7 mayo 2026.`}
          className="w-full min-h-[400px] bg-soft rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono leading-relaxed"
        />
      </div>
    </div>
  );
};

/* ---------- PROFILE ---------- */
const ProfilePanel = () => {
  const { user } = useAuth();
  const [localUser, setLocalUser] = useState(user);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<ProfessionalRatingSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await ratingsService.getMySummary();
        if (!cancelled) setSummary(result);
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!fullName.trim() || fullName.trim() === localUser?.full_name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await apiFetch<AuthUser>("/users/me/", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      const stored = authService.getUser();
      if (stored) {
        authService.setSession({
          access: authService.getAccessToken()!,
          refresh: localStorage.getItem("auth_refresh_token") ?? "",
          user: updated,
        });
      }
      setLocalUser(updated);
      setEditing(false);
      toast({ title: "Nombre actualizado correctamente." });
    } catch {
      toast({ title: "No se pudo actualizar el perfil.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const displayUser = localUser ?? user;
  const average = summary?.average_score ?? 0;
  const total = summary?.total_ratings ?? 0;
  const roundedStars = Math.round(average);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left card — avatar + rating */}
      <div className="bg-card rounded-3xl shadow-soft border border-border p-6 text-center">
        <div className="h-24 w-24 mx-auto rounded-full bg-cta flex items-center justify-center text-3xl font-bold text-primary-foreground mb-3">
          {displayUser ? getUserInitials(displayUser.full_name) : "PR"}
        </div>
        <h3 className="font-display font-bold text-primary text-lg">{displayUser?.full_name ?? "Profesional"}</h3>
        <p className="text-sm text-muted-foreground">Psicología clínica</p>
        <p className="text-xs text-muted-foreground mt-1">{displayUser?.email}</p>
        <div className="flex items-center justify-center gap-1 mt-3">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={cn(
                "h-4 w-4",
                value <= roundedStars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              )}
            />
          ))}
          <span className="text-xs ml-1 text-muted-foreground">
            {total > 0 ? `(${average.toFixed(1)} · ${total} reseña${total === 1 ? "" : "s"})` : "(Sin reseñas aún)"}
          </span>
        </div>
      </div>

      {/* Right card — editable info */}
      <div className="lg:col-span-2 bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-primary">Información profesional</h3>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {/* Nombre — editable */}
          <div className="md:col-span-2">
            <label htmlFor="pro-fullname" className="text-xs text-muted-foreground">Nombre completo</label>
            {editing ? (
              <input
                id="pro-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="w-full mt-1 bg-soft rounded-xl px-3 py-2 outline-none border border-border focus:ring-2 focus:ring-primary/30 text-sm"
              />
            ) : (
              <p className="mt-1 font-medium text-foreground">{displayUser?.full_name ?? "—"}</p>
            )}
          </div>

          {/* Email — read-only */}
          <div>
            <p className="text-xs text-muted-foreground">Correo electrónico</p>
            <p className="mt-1 text-foreground">{displayUser?.email ?? "—"}</p>
          </div>

          {/* Role — read-only */}
          <div>
            <p className="text-xs text-muted-foreground">Rol</p>
            <p className="mt-1 text-foreground">Profesional</p>
          </div>

          {/* Member since */}
          <div>
            <p className="text-xs text-muted-foreground">Miembro desde</p>
            <p className="mt-1 text-foreground">
              {displayUser?.created_at
                ? new Date(displayUser.created_at).toLocaleDateString("es-CO", { month: "short", year: "numeric" })
                : "—"}
            </p>
          </div>

          {/* ID */}
          <div>
            <p className="text-xs text-muted-foreground">ID</p>
            <p className="mt-1 font-mono text-xs text-foreground truncate">{displayUser?.id ?? "—"}</p>
          </div>
        </div>

        {/* Save / cancel */}
        {editing && (
          <div className="flex gap-2 mt-5 pt-4 border-t border-border">
            <Button size="sm" disabled={saving || !fullName.trim()} onClick={() => void handleSave()} className="flex-1">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setFullName(displayUser?.full_name ?? ""); setEditing(false); }} disabled={saving}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- LAYOUT ---------- */
const PsychologistDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState<TabKey>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("aliviapp-sidebar-collapsed") === "true"
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [newAppointmentIds, setNewAppointmentIds] = useState<Set<string>>(new Set());
  const [inboxTargetPatientId, setInboxTargetPatientId] = useState<string | null>(null);
  const [inboxTriageReply, setInboxTriageReply] = useState<TriageReplyDraft | null>(null);
  const appointmentsInitializedRef = useRef(false);
  const knownAppointmentIdsRef = useRef<Set<string>>(new Set());
  const appointmentsCacheRef = useRef<Map<string, Appointment>>(new Map());
  const cancelledNotifiedRef = useRef<Set<string>>(new Set());
  const refreshInFlightRef = useRef(false);

  const refreshAppointments = useCallback(async () => {
    if (!user?.id || refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    try {
      const scheduled = await schedulingService.listAppointments("SCHEDULED");
      const previousIds = new Set(knownAppointmentIdsRef.current);
      const currentIds = new Set(scheduled.map((appointment) => appointment.id));

      // Primera carga: guarda el estado actual sin spamear toasts.
      if (!appointmentsInitializedRef.current) {
        appointmentsInitializedRef.current = true;
        knownAppointmentIdsRef.current = currentIds;
        appointmentsCacheRef.current = new Map(
          scheduled.map((appointment) => [appointment.id, appointment])
        );
        setAppointments(scheduled);

        const seen = getSeenAppointmentIds(user.id);
        const unseen = scheduled.filter((appointment) => !seen.has(appointment.id));
        setNewAppointmentIds(new Set(unseen.map((appointment) => appointment.id)));
        return;
      }

      // Citas nuevas agendadas mientras el profesional está en el panel.
      const newlyBooked = scheduled.filter((appointment) => !previousIds.has(appointment.id));
      newlyBooked.forEach((appointment) => {
        toast({
          title: "Nueva cita agendada",
          description: `${appointment.patient_name} agendó "${appointment.topic}" el ${formatAppointmentDate(appointment.scheduled_at)} a las ${formatAppointmentTime(appointment.scheduled_at)}.`,
        });
      });

      // Citas canceladas por el paciente.
      for (const appointmentId of previousIds) {
        if (currentIds.has(appointmentId) || cancelledNotifiedRef.current.has(appointmentId)) {
          continue;
        }

        const cancelledAppointment = appointmentsCacheRef.current.get(appointmentId);
        if (!cancelledAppointment) continue;

        cancelledNotifiedRef.current.add(appointmentId);
        toast({
          title: "Cita cancelada",
          description: `${cancelledAppointment.patient_name} canceló "${cancelledAppointment.topic}" del ${formatAppointmentDate(cancelledAppointment.scheduled_at)} a las ${formatAppointmentTime(cancelledAppointment.scheduled_at)}.`,
          variant: "destructive",
        });
      }

      knownAppointmentIdsRef.current = currentIds;
      appointmentsCacheRef.current = new Map(
        scheduled.map((appointment) => [appointment.id, appointment])
      );
      setAppointments(scheduled);

      const seen = getSeenAppointmentIds(user.id);
      const unseen = scheduled.filter((appointment) => !seen.has(appointment.id));
      setNewAppointmentIds(new Set(unseen.map((appointment) => appointment.id)));
    } catch {
      // Silenciar errores de polling; el panel muestra su propio estado de carga
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    refreshAppointments();

    // Poll frecuente para no depender de reiniciar/recargar la página.
    const interval = window.setInterval(refreshAppointments, 5000);

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        refreshAppointments();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refreshAppointments]);

  const handleTabChange = (tab: TabKey) => {
    setActive(tab);
    setMobileOpen(false);
    if (tab === "agenda" && user?.id) {
      markAppointmentsSeen(user.id, appointments.map((a) => a.id));
      setNewAppointmentIds(new Set());
    }
  };

  const handleOpenPatientChat = useCallback(
    (patientId: string, triageReply?: TriageReplyDraft) => {
      setInboxTargetPatientId(patientId);
      setInboxTriageReply(triageReply ?? null);
      setActive("inbox");
      setMobileOpen(false);
    },
    []
  );

  const handleInboxTargetHandled = useCallback(() => {
    setInboxTargetPatientId(null);
  }, []);

  const handleTriageReplyHandled = useCallback(() => {
    setInboxTriageReply(null);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("aliviapp-sidebar-collapsed", String(next));
      return next;
    });
  };

  const tabs = baseTabs.map((tab) => ({
    ...tab,
    badge: tab.key === "agenda" && appointments.length > 0 ? String(appointments.length) : undefined,
    notify: tab.key === "agenda" && newAppointmentIds.size > 0,
  }));

  const renderPanel = () => {
    switch (active) {
      case "overview":
        return (
          <OverviewPanel
            onNavigate={handleTabChange}
            onOpenPatientChat={handleOpenPatientChat}
            appointments={appointments}
            newAppointmentIds={newAppointmentIds}
          />
        );
      case "inbox":
        return (
          <InboxPanel
            appointments={appointments}
            initialPatientId={inboxTargetPatientId}
            triageReplyDraft={inboxTriageReply}
            onTargetHandled={handleInboxTargetHandled}
            onTriageReplyHandled={handleTriageReplyHandled}
          />
        );
      case "agenda":
        return (
          <ProfessionalAgendaPanel
            appointments={appointments}
            onAppointmentsChange={setAppointments}
            newAppointmentIds={newAppointmentIds}
          />
        );
      case "alerts": return <AlertsPanel />;
      case "patients": return <PatientsPanel />;
      case "notes": return <NotesPanel />;
      case "profile": return <ProfilePanel />;
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-soft flex">
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 h-dvh bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden shrink-0 transition-all duration-300",
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",
          "lg:translate-x-0",
          sidebarCollapsed
            ? "lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-0"
            : "lg:w-72 lg:opacity-100"
        )}
      >
        <div
          className="p-6 border-b border-sidebar-border flex items-center justify-between shrink-0"
          onWheel={(e) => e.stopPropagation()}
        >
          <Logo variant="light" />
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-sidebar-accent transition-smooth">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-sidebar-accent flex items-center gap-3 shrink-0"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center font-bold">
            {user ? getUserInitials(user.full_name) : "P"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{user?.full_name || "Profesional"}</div>
            <div className="text-xs text-sidebar-foreground/70 truncate">{user?.email || "Online"}</div>
          </div>
        </div>

        <nav
          data-sidebar-nav
          className="flex-1 min-h-0 p-4 space-y-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
        >
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge && (
                  <span className={cn(
                    "h-5 min-w-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center",
                    tab.notify
                      ? "bg-success text-success-foreground animate-pulse-soft"
                      : isActive
                        ? "bg-sidebar-primary-foreground/20"
                        : "bg-accent text-accent-foreground"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div
          className="p-4 border-t border-sidebar-border shrink-0 bg-sidebar"
          onWheel={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-sidebar-foreground bg-sidebar-accent/50 border border-sidebar-border hover:bg-destructive/20 hover:border-destructive/40 hover:text-red-100 transition-smooth group"
          >
            <LogOut className="h-5 w-5 text-sidebar-foreground/70 group-hover:text-red-200" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="h-16 bg-card border-b border-border shrink-0 px-4 lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Mostrar menú" : "Ocultar menú"}
              >
                {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
              <div>
                <h1 className="font-display font-bold text-lg text-primary capitalize">
                  {tabs.find((t) => t.key === active)?.label}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Panel del profesional · AliviApp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleTabChange("agenda")}>
                <Calendar className="h-4 w-4" />
                Agenda
                {newAppointmentIds.size > 0 && (
                  <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full text-xs font-bold bg-success text-success-foreground">
                    {newAppointmentIds.size}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 lg:p-8">
          <DashboardContent
            fullWidth={active === "inbox" || active === "notes"}
            narrow={active === "profile"}
          >
            {renderPanel()}
          </DashboardContent>
        </div>
      </main>
    </div>
  );
};

export default PsychologistDashboard;
