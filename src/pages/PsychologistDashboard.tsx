import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { getUserInitials } from "@/utils/user.utils";
import { toast } from "@/hooks/use-toast";
import { chatService } from "@/services/chat.service";
import { usersService } from "@/services/users.service";
import type { User as AuthUser } from "@/types/auth.types";
import type { Conversation, Message } from "@/types/chat.types";
import {
  LayoutDashboard,
  MessageCircle,
  Calendar,
  AlertTriangle,
  Users,
  FileText,
  BarChart3,
  User,
  ArrowLeft,
  Menu,
  X,
  Brain,
  Clock,
  TrendingUp,
  CheckCircle2,
  Search,
  Send,
  Plus,
  Filter,
  Star,
  Activity,
  Heart,
  ShieldAlert,
  Phone,
  Video,
  MoreVertical,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey =
  | "overview"
  | "inbox"
  | "agenda"
  | "alerts"
  | "patients"
  | "notes"
  | "stats"
  | "profile";

const tabs: { key: TabKey; label: string; icon: typeof MessageCircle; badge?: string }[] = [
  { key: "overview", label: "Resumen", icon: LayoutDashboard },
  { key: "inbox", label: "Bandeja de chats", icon: MessageCircle, badge: "5" },
  { key: "agenda", label: "Agenda", icon: Calendar, badge: "3" },
  { key: "alerts", label: "Alertas críticas", icon: AlertTriangle, badge: "2" },
  { key: "patients", label: "Pacientes", icon: Users },
  { key: "notes", label: "Notas clínicas", icon: FileText },
  { key: "stats", label: "Estadísticas", icon: BarChart3 },
  { key: "profile", label: "Perfil profesional", icon: User },
];

/* ---------- OVERVIEW ---------- */
const OverviewPanel = ({ onNavigate }: { onNavigate: (k: TabKey) => void }) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-primary to-primary-deep rounded-3xl p-6 lg:p-8 text-primary-foreground shadow-elegant">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-primary-foreground/80 text-sm">Buenos días</p>
          <h2 className="font-display text-2xl lg:text-3xl font-bold">Dra. Camila Rojas</h2>
          <p className="text-primary-foreground/80 text-sm mt-1">
            Psicología clínica · Lic. PSI-2398 · Acme Corp + 3 empresas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
          <span className="text-sm font-medium">Disponible para chat</span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Chats activos", value: "5", icon: MessageCircle },
          { label: "Sesiones hoy", value: "8", icon: Calendar },
          { label: "Alertas críticas", value: "2", icon: AlertTriangle },
          { label: "Satisfacción", value: "4.9", icon: Star },
        ].map((s) => (
          <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/15">
            <s.icon className="h-4 w-4 mb-1 opacity-80" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-80">{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-primary">Próximas sesiones</h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("agenda")}>
            Ver agenda
          </Button>
        </div>
        <div className="space-y-3">
          {[
            { time: "10:30", patient: "Daniel M.", type: "Chat seguimiento", company: "Acme Corp", urgent: false },
            { time: "11:15", patient: "Sofía L.", type: "Sesión inicial", company: "Nova S.A.", urgent: true },
            { time: "14:00", patient: "Mateo R.", type: "Chat ansiedad", company: "Acme Corp", urgent: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-soft hover:bg-secondary transition-smooth">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-bold">{s.time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  {s.patient}
                  {s.urgent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">URGENTE</span>}
                </div>
                <div className="text-xs text-muted-foreground">{s.type} · {s.company}</div>
              </div>
              <Button variant="hero" size="sm" onClick={() => onNavigate("inbox")}>
                Abrir
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-5 w-5 text-cta" />
          <h3 className="font-display font-bold text-primary">Triage IA</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Casos priorizados automáticamente según riesgo emocional.
        </p>
        <div className="space-y-2">
          {[
            { name: "Sofía L.", risk: "Alto", color: "bg-destructive" },
            { name: "Mateo R.", risk: "Medio", color: "bg-amber-500" },
            { name: "Lucía P.", risk: "Bajo", color: "bg-success" },
          ].map((c) => (
            <div key={c.name} className="flex items-center justify-between p-2 rounded-xl bg-soft">
              <span className="text-sm font-medium">{c.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold ${c.color}`}>
                {c.risk}
              </span>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onNavigate("alerts")}>
          Ver alertas
        </Button>
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-4">
      {[
        { label: "Sesiones esta semana", value: "32", trend: "+12%", icon: Activity },
        { label: "Pacientes activos", value: "47", trend: "+4", icon: Users },
        { label: "Tiempo promedio respuesta", value: "3 min", trend: "-1m", icon: TrendingUp },
      ].map((m) => (
        <div key={m.label} className="bg-card rounded-2xl border border-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <m.icon className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold text-success">{m.trend}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{m.value}</div>
          <div className="text-xs text-muted-foreground">{m.label}</div>
        </div>
      ))}
    </div>
  </div>
);

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

const InboxPanel = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [patients, setPatients] = useState<Record<string, AuthUser>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

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

        if (list.length > 0) setActiveId(list[0].id);
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

  const { connected, isPeerTyping, sendMessage: wsSend, sendTyping } = useChatSocket(activeId, handleIncoming);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPeerTyping]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activePatient = active ? patients[active.patient_id] : undefined;
  const isClosed = active ? active.status !== "ACTIVE" || new Date(active.expires_at) <= new Date() : false;

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

    if (connected) {
      wsSend(content);
      return;
    }

    try {
      const message = await chatService.sendMessage(activeId, content);
      setMessages((prev) => [...prev, message]);
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
            const expired = c.status !== "ACTIVE" || new Date(c.expires_at) <= new Date();
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
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-1">
                    <div className="font-semibold text-sm text-foreground truncate">{name}</div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{inboxTime(c.started_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{expired ? "Chat finalizado" : "Chat activo"}</p>
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
                      ? "Chat finalizado"
                      : isPeerTyping
                        ? "Escribiendo…"
                        : connected
                          ? "En línea · conectado"
                          : "Conectando…"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" disabled><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-soft">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-soft",
                    m.sender_id === user?.id
                      ? "bg-cta text-primary-foreground rounded-tr-sm"
                      : "bg-card text-foreground rounded-tl-sm border border-border"
                  )}>
                    <p className="leading-relaxed">{m.content}</p>
                    <div className={cn("text-[10px] mt-1", m.sender_id === user?.id ? "text-white/70" : "text-muted-foreground")}>
                      {inboxTime(m.sent_at)}
                    </div>
                  </div>
                </div>
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
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  disabled={isClosed}
                  placeholder="Escribe una respuesta profesional…"
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
    </div>
  );
};

/* ---------- AGENDA ---------- */
const AgendaPanel = () => {
  const days = ["Lun 28", "Mar 29", "Mié 30", "Jue 1", "Vie 2"];
  const slots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
  const sessions: Record<string, { patient: string; type: string; color: string } | null> = {
    "Lun 28-09:00": { patient: "Daniel M.", type: "Chat", color: "bg-primary/10 text-primary border-primary/30" },
    "Lun 28-11:00": { patient: "Sofía L.", type: "Urgente", color: "bg-destructive/10 text-destructive border-destructive/30" },
    "Mar 29-10:00": { patient: "Mateo R.", type: "Chat", color: "bg-primary/10 text-primary border-primary/30" },
    "Mié 30-15:00": { patient: "Lucía P.", type: "Seguimiento", color: "bg-success/10 text-success border-success/30" },
    "Jue 1-09:00": { patient: "Juan C.", type: "Inicial", color: "bg-cta/10 text-cta border-cta/30" },
    "Vie 2-16:00": { patient: "Ana G.", type: "Chat", color: "bg-primary/10 text-primary border-primary/30" },
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h3 className="font-display font-bold text-primary text-lg">Semana del 28 abr — 2 may</h3>
            <p className="text-xs text-muted-foreground">8 sesiones programadas · 3 espacios disponibles</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Hoy</Button>
            <Button variant="hero" size="sm"><Plus className="h-4 w-4" /> Bloquear horario</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-[80px_repeat(5,minmax(140px,1fr))] gap-2 min-w-[800px]">
            <div></div>
            {days.map((d) => (
              <div key={d} className="text-center font-semibold text-sm text-foreground py-2 bg-soft rounded-xl">{d}</div>
            ))}
            {slots.map((slot) => (
              <>
                <div key={slot} className="text-xs text-muted-foreground font-medium flex items-center justify-end pr-2">{slot}</div>
                {days.map((d) => {
                  const s = sessions[`${d}-${slot}`];
                  return (
                    <div key={`${d}-${slot}`} className="min-h-[60px] border border-border rounded-xl p-1.5">
                      {s && (
                        <div className={`h-full rounded-lg border px-2 py-1.5 ${s.color}`}>
                          <div className="text-xs font-bold truncate">{s.patient}</div>
                          <div className="text-[10px] opacity-80">{s.type}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
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

/* ---------- STATS ---------- */
const StatsPanel = () => (
  <div className="space-y-6">
    <div className="grid md:grid-cols-4 gap-4">
      {[
        { label: "Sesiones del mes", value: "128", trend: "+18%", icon: Activity },
        { label: "Pacientes únicos", value: "47", trend: "+5", icon: Users },
        { label: "Tasa de respuesta", value: "98%", trend: "+2%", icon: CheckCircle2 },
        { label: "Satisfacción", value: "4.9/5", trend: "+0.1", icon: Star },
      ].map((m) => (
        <div key={m.label} className="bg-card rounded-2xl border border-border p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <m.icon className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold text-success">{m.trend}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{m.value}</div>
          <div className="text-xs text-muted-foreground">{m.label}</div>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <h3 className="font-display font-bold text-primary mb-4">Sesiones por semana</h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {[18, 24, 22, 30, 28, 32, 26].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/15 rounded-t-xl flex items-end justify-center" style={{ height: `${(v / 32) * 100}%` }}>
                <div className="w-full bg-cta rounded-t-xl" style={{ height: `${(v / 32) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">S{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
        <h3 className="font-display font-bold text-primary mb-4">Motivos de consulta</h3>
        <div className="space-y-3">
          {[
            { label: "Ansiedad", pct: 38 },
            { label: "Estrés laboral", pct: 27 },
            { label: "Insomnio", pct: 15 },
            { label: "Relaciones", pct: 12 },
            { label: "Otros", pct: 8 },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{r.label}</span>
                <span className="text-muted-foreground">{r.pct}%</span>
              </div>
              <div className="h-2 bg-soft rounded-full overflow-hidden">
                <div className="h-full bg-cta rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ---------- PROFILE ---------- */
const ProfilePanel = () => (
  <div className="grid lg:grid-cols-3 gap-6">
    <div className="bg-card rounded-3xl shadow-soft border border-border p-6 text-center">
      <div className="h-24 w-24 mx-auto rounded-full bg-cta flex items-center justify-center text-3xl font-bold text-primary-foreground mb-3">
        CR
      </div>
      <h3 className="font-display font-bold text-primary text-lg">Dra. Camila Rojas</h3>
      <p className="text-sm text-muted-foreground">Psicología clínica</p>
      <p className="text-xs text-muted-foreground mt-1">Lic. PSI-2398</p>
      <div className="flex items-center justify-center gap-1 mt-3">
        {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
        <span className="text-xs ml-1 text-muted-foreground">(4.9 · 312 reseñas)</span>
      </div>
      <Button variant="outline" size="sm" className="mt-4 w-full">Editar perfil público</Button>
    </div>

    <div className="lg:col-span-2 bg-card rounded-3xl shadow-soft border border-border p-6">
      <h3 className="font-display font-bold text-primary mb-4">Información profesional</h3>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="text-xs text-muted-foreground">Nombre completo</label>
          <input defaultValue="Camila Rojas Méndez" className="w-full mt-1 bg-soft rounded-xl px-3 py-2 outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Licencia profesional</label>
          <input defaultValue="PSI-2398" className="w-full mt-1 bg-soft rounded-xl px-3 py-2 outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <input defaultValue="camila.rojas@aliviapp.com" className="w-full mt-1 bg-soft rounded-xl px-3 py-2 outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Teléfono</label>
          <input defaultValue="+57 300 123 4567" className="w-full mt-1 bg-soft rounded-xl px-3 py-2 outline-none" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground">Especialidades</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Ansiedad", "Estrés laboral", "TCC", "Mindfulness", "Duelo"].map((t) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground">Bio profesional</label>
          <textarea
            defaultValue="Psicóloga clínica con 10+ años de experiencia en terapia cognitivo-conductual. Especializada en bienestar laboral y manejo de ansiedad."
            className="w-full mt-1 bg-soft rounded-xl px-3 py-2 outline-none min-h-[100px]"
          />
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="font-display font-bold text-primary mb-3">Disponibilidad</h4>
        <div className="grid grid-cols-7 gap-2">
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
            <button
              key={d}
              className={cn(
                "py-3 rounded-xl text-sm font-bold transition-smooth",
                i < 5 ? "bg-success/10 text-success" : "bg-soft text-muted-foreground"
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4 p-3 rounded-2xl bg-soft">
          <Heart className="h-5 w-5 text-cta" />
          <div className="text-sm">
            <div className="font-semibold">Modo disponible para chat</div>
            <div className="text-xs text-muted-foreground">Recibirás nuevas conversaciones en tu bandeja.</div>
          </div>
          <div className="ml-auto h-6 w-11 rounded-full bg-success relative">
            <div className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------- LAYOUT ---------- */
const PsychologistDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [active, setActive] = useState<TabKey>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderPanel = () => {
    switch (active) {
      case "overview": return <OverviewPanel onNavigate={setActive} />;
      case "inbox": return <InboxPanel />;
      case "agenda": return <AgendaPanel />;
      case "alerts": return <AlertsPanel />;
      case "patients": return <PatientsPanel />;
      case "notes": return <NotesPanel />;
      case "stats": return <StatsPanel />;
      case "profile": return <ProfilePanel />;
    }
  };

  return (
    <div className="min-h-screen bg-soft flex">
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <Logo variant="light" />
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 mx-4 mt-4 rounded-2xl bg-sidebar-accent flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-cta flex items-center justify-center font-bold">
            {user ? getUserInitials(user.full_name) : "P"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{user?.full_name || "Profesional"}</div>
            <div className="text-xs text-sidebar-foreground/70 truncate">{user?.email || "Online"}</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActive(tab.key); setMobileOpen(false); }}
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
                    isActive ? "bg-sidebar-primary-foreground/20" : "bg-accent text-accent-foreground"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-smooth"
          >
            <ArrowLeft className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
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
            <Button variant="outline" size="sm" onClick={() => setActive("alerts")}>
              <AlertTriangle className="h-4 w-4" /> Alertas
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="animate-fade-in">{renderPanel()}</div>
        </div>
      </main>
    </div>
  );
};

export default PsychologistDashboard;
