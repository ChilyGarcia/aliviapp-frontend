import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  AlertTriangle,
  Heart,
  Calendar,
  X,
  Plus,
  Clock,
  FileText,
  User,
  CalendarPlus,
  MessageCircle,
  Video,
  History,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getMaxBookingDateIso,
  getMinBookingDateIso,
  MAX_BOOKING_DAYS_AHEAD,
} from "@/lib/scheduling-dates";
import { toast } from "@/hooks/use-toast";
import { schedulingService } from "@/services/scheduling.service";
import { usersService } from "@/services/users.service";
import type { User as AuthUser } from "@/types/auth.types";
import type { Appointment, AppointmentModality } from "@/types/scheduling.types";

type NotificationType = "info" | "warn" | "success";
type TabKey = "alerts" | "upcoming" | "history";

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
}

const NOTIFICATION_STYLES: Record<NotificationType, string> = {
  warn: "bg-warning/10 text-warning border-warning/20",
  info: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
};

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  warn: AlertTriangle,
  info: Bell,
  success: Heart,
};

const MODALITY_CONFIG: Record<
  AppointmentModality,
  { label: string; icon: typeof MessageCircle; className: string }
> = {
  chat: { label: "Chat", icon: MessageCircle, className: "bg-primary/10 text-primary" },
  video: { label: "Videollamada", icon: Video, className: "bg-cta/15 text-cta" },
  audio: { label: "Audio", icon: User, className: "bg-accent/15 text-accent" },
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "warn",
    title: "Recordatorio de bienestar",
    description: "Has tenido una semana intensa. Tómate 5 minutos para respirar profundamente.",
    time: "Hace 10 min",
  },
  {
    id: "n2",
    type: "info",
    title: "Sesión recomendada",
    description: "Tu psicólogo sugiere una sesión de seguimiento esta semana.",
    time: "Hace 2 h",
  },
];

const formatSessionDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatSessionTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

const formatCompletedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const createNotification = (
  type: NotificationType,
  title: string,
  description: string
): AppNotification => ({
  id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  title,
  description,
  time: "Hace un momento",
});

interface AlertsPanelProps {
  onOpenChat?: (professionalId: string) => void;
}

export const AlertsPanel = ({ onOpenChat }: AlertsPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<AuthUser[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [form, setForm] = useState({
    professionalId: "",
    date: "",
    slot: "",
    modality: "chat" as AppointmentModality,
    topic: "",
    notes: "",
    reminder: "30",
  });

  const loadAppointments = useCallback(async () => {
    const [scheduled, completed] = await Promise.all([
      schedulingService.listAppointments("SCHEDULED"),
      schedulingService.listAppointments("COMPLETED"),
    ]);
    setUpcoming(scheduled);
    setHistory(completed);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const pros = await usersService.listProfessionals();
        if (cancelled) return;
        setProfessionals(pros.filter((p) => p.is_active));
        await loadAppointments();
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "No se pudieron cargar las citas",
            description: errorMessage(error, "Intenta de nuevo más tarde"),
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
  }, [loadAppointments]);

  useEffect(() => {
    if (!form.professionalId || !form.date) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    (async () => {
      try {
        const slots = await schedulingService.listAvailableSlots(form.professionalId, form.date);
        if (cancelled) return;
        setAvailableSlots(slots.map((s) => s.scheduled_at));
        setForm((prev) => ({ ...prev, slot: "" }));
      } catch (error) {
        if (!cancelled) {
          setAvailableSlots([]);
          toast({
            title: "No se pudieron cargar horarios",
            description: errorMessage(error, "El profesional puede no tener disponibilidad ese día"),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.professionalId, form.date]);

  const totalCount = notifications.length + upcoming.length + history.length;

  const resetForm = () =>
    setForm({
      professionalId: "",
      date: "",
      slot: "",
      modality: "chat",
      topic: "",
      notes: "",
      reminder: "30",
    });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.professionalId || !form.date || !form.slot || !form.topic) {
      toast({ title: "Faltan datos", description: "Completa profesional, fecha, horario y tema." });
      return;
    }

    setSubmitting(true);
    try {
      const appointment = await schedulingService.bookAppointment({
        professional_id: form.professionalId,
        scheduled_at: form.slot,
        topic: form.topic,
        notes: form.notes,
        modality: form.modality,
        reminder_minutes: Number(form.reminder),
      });

      setUpcoming((prev) => [appointment, ...prev]);
      setNotifications((prev) => [
        createNotification(
          "success",
          "Sesión agendada",
          `Agendaste "${appointment.topic}" con ${appointment.professional_name} el ${formatSessionDate(appointment.scheduled_at)} a las ${formatSessionTime(appointment.scheduled_at)}.`
        ),
        ...prev,
      ]);

      toast({
        title: "Sesión creada",
        description: `Tu cita con ${appointment.professional_name} fue agendada. El profesional recibirá una notificación.`,
      });
      setOpen(false);
      resetForm();
      setActiveTab("upcoming");
    } catch (error) {
      toast({
        title: "No se pudo agendar",
        description: errorMessage(error, "El horario puede haber sido tomado por otro paciente"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancelSession = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      await schedulingService.cancelAppointment(cancelTarget.id);
      setUpcoming((prev) => prev.filter((s) => s.id !== cancelTarget.id));
      setNotifications((prev) => [
        createNotification(
          "warn",
          "Sesión cancelada",
          `Cancelaste "${cancelTarget.topic}" con ${cancelTarget.professional_name} del ${formatSessionDate(cancelTarget.scheduled_at)} a las ${formatSessionTime(cancelTarget.scheduled_at)}.`
        ),
        ...prev,
      ]);
      setActiveTab("alerts");
      toast({
        title: "Sesión cancelada",
        description: `Se notificó a ${cancelTarget.professional_name} sobre la cancelación.`,
        variant: "destructive",
      });
      setCancelTarget(null);
    } catch (error) {
      toast({
        title: "No se pudo cancelar",
        description: errorMessage(error, "Intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const SessionCard = ({
    session,
    variant,
    onOpenChat,
    onRequestCancel,
  }: {
    session: Appointment;
    variant: "upcoming" | "history";
    onOpenChat?: (professionalId: string) => void;
    onRequestCancel?: (session: Appointment) => void;
  }) => {
    const modality = MODALITY_CONFIG[session.modality];
    const ModalityIcon = modality.icon;

    return (
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-elegant transition-smooth">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
              modality.className
            )}
          >
            <ModalityIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-display font-bold text-primary leading-tight">{session.topic}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {session.professional_name}
                </p>
              </div>
              <span
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0",
                  variant === "upcoming"
                    ? "bg-success/15 text-success"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {variant === "upcoming" ? "Próxima" : "Completada"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatSessionDate(session.scheduled_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatSessionTime(session.scheduled_at)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                  modality.className
                )}
              >
                <ModalityIcon className="h-3.5 w-3.5" />
                {modality.label}
              </span>
            </div>

            {session.notes && (
              <div className="mt-4 bg-secondary/60 border border-border rounded-xl p-3 text-sm text-muted-foreground flex gap-2">
                <FileText className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <p className="leading-relaxed">{session.notes}</p>
              </div>
            )}

            {variant === "upcoming" ? (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => onOpenChat?.(session.professional_id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {session.modality === "chat" ? "Abrir chat" : "Unirse"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                  onClick={() => onRequestCancel?.(session)}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-success" />
                Realizada el{" "}
                {session.completed_at
                  ? formatCompletedDate(session.completed_at)
                  : formatSessionDate(session.scheduled_at)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando citas…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="bg-card-grad rounded-2xl border border-border p-5 shadow-soft flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-display font-bold text-primary text-lg">Centro de notificaciones</div>
          <p className="text-sm text-muted-foreground">
            Alertas, recordatorios y sesiones agendadas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-cta text-primary-foreground text-sm font-bold px-3 py-1 rounded-full min-w-[2rem] text-center">
            {totalCount}
          </span>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm">
                <Plus className="h-4 w-4" /> Crear sesión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-primary flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5 text-cta" /> Agendar sesión
                </DialogTitle>
                <DialogDescription>
                  Programa un chat con tu psicólogo según su disponibilidad real.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Profesional
                  </Label>
                  <Select
                    value={form.professionalId}
                    onValueChange={(v) => setForm({ ...form, professionalId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un profesional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Fecha
                  </Label>
                  <Input
                    type="date"
                    min={getMinBookingDateIso()}
                    max={getMaxBookingDateIso()}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Solo puedes agendar desde hoy hasta {MAX_BOOKING_DAYS_AHEAD} días en el futuro.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Horario disponible
                  </Label>
                  {loadingSlots ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios…
                    </p>
                  ) : (
                    <Select
                      value={form.slot}
                      onValueChange={(v) => setForm({ ...form, slot: v })}
                      disabled={!form.professionalId || !form.date || availableSlots.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !form.professionalId || !form.date
                              ? "Selecciona profesional y fecha"
                              : availableSlots.length === 0
                                ? "Sin horarios disponibles"
                                : "Selecciona un horario"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {formatSessionTime(slot)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Modalidad</Label>
                    <Select
                      value={form.modality}
                      onValueChange={(v) =>
                        setForm({ ...form, modality: v as AppointmentModality })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="video" disabled className="opacity-50">
                          Videollamada (próximamente)
                        </SelectItem>
                        <SelectItem value="audio" disabled className="opacity-50">
                          Audio (próximamente)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recordarme</Label>
                    <Select
                      value={form.reminder}
                      onValueChange={(v) => setForm({ ...form, reminder: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min antes</SelectItem>
                        <SelectItem value="30">30 min antes</SelectItem>
                        <SelectItem value="60">1 hora antes</SelectItem>
                        <SelectItem value="1440">1 día antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tema principal</Label>
                  <Input
                    placeholder="Ej: Manejo de ansiedad laboral"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Notas previas (opcional)
                  </Label>
                  <Textarea
                    placeholder="Describe lo que has sentido o preguntas que quieres hacer."
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Agendando…
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4" /> Agendar sesión
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="w-full h-auto p-1.5 bg-secondary/80 rounded-2xl grid grid-cols-3 gap-1">
          <TabsTrigger
            value="alerts"
            className="rounded-xl py-2.5 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft hover:bg-card/60 data-[state=active]:hover:bg-card"
          >
            <Bell className="h-4 w-4" />
            <span>Alertas</span>
            {notifications.length > 0 && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="rounded-xl py-2.5 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft hover:bg-card/60 data-[state=active]:hover:bg-card"
          >
            <Calendar className="h-4 w-4" />
            <span>Próximas</span>
            {upcoming.length > 0 && (
              <span className="text-[10px] font-bold bg-success/15 text-success px-1.5 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl py-2.5 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-soft hover:bg-card/60 data-[state=active]:hover:bg-card"
          >
            <History className="h-4 w-4" />
            <span>Historial</span>
            {history.length > 0 && (
              <span className="text-[10px] font-bold bg-muted-foreground/15 text-muted-foreground px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 bg-card border border-border rounded-2xl">
              No tienes alertas pendientes
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type];
              return (
                <div
                  key={notification.id}
                  className="bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-soft hover:shadow-elegant transition-smooth"
                >
                  <div
                    className={cn(
                      "h-11 w-11 rounded-xl border flex items-center justify-center shrink-0",
                      NOTIFICATION_STYLES[notification.type]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground">{notification.title}</h4>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg p-1 shrink-0 transition-colors"
                        aria-label="Descartar alerta"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                    <span className="text-xs text-muted-foreground mt-3 inline-block">
                      {notification.time}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcoming.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl space-y-3">
              <p className="text-muted-foreground">No tienes sesiones agendadas.</p>
              <Button variant="hero" size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Crear sesión
              </Button>
            </div>
          ) : (
            upcoming.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                variant="upcoming"
                onOpenChat={onOpenChat}
                onRequestCancel={setCancelTarget}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 bg-card border border-border rounded-2xl">
              Aún no tienes sesiones completadas.
            </div>
          ) : (
            history.map((session) => (
              <SessionCard key={session.id} session={session} variant="history" />
            ))
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && !cancelling && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Cancelar esta sesión?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Estás a punto de cancelar tu cita con{" "}
                  <strong className="text-foreground">{cancelTarget?.professional_name}</strong>.
                </p>
                {cancelTarget && (
                  <p>
                    {cancelTarget.topic} · {formatSessionDate(cancelTarget.scheduled_at)} a las{" "}
                    {formatSessionTime(cancelTarget.scheduled_at)}
                  </p>
                )}
                <p>Esta acción no se puede deshacer y el profesional será notificado.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Volver</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmCancelSession}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cancelando…
                </>
              ) : (
                "Sí, cancelar cita"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
