import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isPastDay, appointmentHasEnded } from "@/lib/scheduling-dates";
import { schedulingService } from "@/services/scheduling.service";
import type {
  Appointment,
  AvailabilityBlock,
  DateAvailabilityOverride,
  DateOverrideMode,
  DateTimeBlock,
} from "@/types/scheduling.types";
import { MonthlyAvailabilityDialog } from "@/components/dashboard/MonthlyAvailabilityDialog";
import {
  Bell,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

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

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getOverrideForDate = (overrides: DateAvailabilityOverride[], date: Date) =>
  overrides.find((item) => item.date === toIsoDate(date));

const getEffectiveMode = (
  date: Date,
  recurring: AvailabilityBlock[],
  overrides: DateAvailabilityOverride[]
): DateOverrideMode | "empty" => {
  const override = getOverrideForDate(overrides, date);
  if (override?.mode === "unavailable") return "unavailable";
  if (override?.mode === "custom") return "custom";
  const hasRecurring = recurring.some((block) => block.day_of_week === weekdayIndex(date));
  return hasRecurring ? "recurring" : "empty";
};

const getEffectiveBlocks = (
  date: Date,
  recurring: AvailabilityBlock[],
  overrides: DateAvailabilityOverride[]
): DateTimeBlock[] => {
  const override = getOverrideForDate(overrides, date);
  if (override?.mode === "unavailable") return [];
  if (override?.mode === "custom") return override.blocks;
  return recurring
    .filter((block) => block.day_of_week === weekdayIndex(date))
    .map((block) => ({ start_time: block.start_time, end_time: block.end_time }));
};

const MODE_STYLES = {
  recurring: {
    label: "Plantilla",
    shortLabel: "Plantilla",
    card: "border-primary/40 bg-primary/5",
    badge: "bg-primary/15 text-primary",
    icon: Repeat,
  },
  custom: {
    label: "Personalizado",
    shortLabel: "Pers.",
    card: "border-success/40 bg-success/5",
    badge: "bg-success/15 text-success",
    icon: CalendarDays,
  },
  unavailable: {
    label: "No disponible",
    shortLabel: "Bloq.",
    card: "border-destructive/30 bg-destructive/5",
    badge: "bg-destructive/15 text-destructive",
    icon: Ban,
  },
  empty: {
    label: "Sin horario",
    shortLabel: "Sin hor.",
    card: "border-border bg-soft/30",
    badge: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  past: {
    label: "Pasado",
    shortLabel: "Pasado",
    card: "border-border/50 bg-muted/20",
    badge: "bg-muted/80 text-muted-foreground",
    icon: Clock,
  },
} as const;

const formatBlockTime = (start: string, end: string) => `${start}–${end}`;

const getDayDisplayMode = (
  date: Date,
  recurring: AvailabilityBlock[],
  overrides: DateAvailabilityOverride[]
) => {
  if (isPastDay(date)) return "past" as const;
  return getEffectiveMode(date, recurring, overrides);
};

interface ProfessionalAgendaPanelProps {
  appointments: Appointment[];
  onAppointmentsChange: (next: Appointment[]) => void;
  newAppointmentIds: Set<string>;
}

export const ProfessionalAgendaPanel = ({
  appointments,
  onAppointmentsChange,
  newAppointmentIds,
}: ProfessionalAgendaPanelProps) => {
  const [recurringBlocks, setRecurringBlocks] = useState<AvailabilityBlock[]>([]);
  const [overrides, setOverrides] = useState<DateAvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayMode, setDayMode] = useState<DateOverrideMode>("recurring");
  const [dayBlocks, setDayBlocks] = useState<DateTimeBlock[]>([]);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [pendingSelectDay, setPendingSelectDay] = useState<Date | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  const weekRangeLabel = `${weekDays[0].toLocaleDateString("es-CO", { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString("es-CO", { day: "numeric", month: "short" })}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(start.getDate() + 6);
    try {
      const [availability, weekOverrides] = await Promise.all([
        schedulingService.getMyAvailability(),
        schedulingService.listDateOverrides(toIsoDate(start), toIsoDate(end)),
      ]);
      setRecurringBlocks(availability);
      setOverrides(weekOverrides);
    } catch (error) {
      toast({
        title: "No se pudo cargar la agenda",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading && pendingSelectDay) {
      selectDay(pendingSelectDay);
      setPendingSelectDay(null);
    }
  }, [loading, pendingSelectDay, overrides, recurringBlocks]);

  const selectDay = (date: Date) => {
    setSelectedDay(date);
    const override = getOverrideForDate(overrides, date);
    if (override?.mode === "unavailable") {
      setDayMode("unavailable");
      setDayBlocks([]);
      return;
    }
    if (override?.mode === "custom") {
      setDayMode("custom");
      setDayBlocks(override.blocks.length > 0 ? override.blocks : [{ start_time: "09:00", end_time: "12:00" }]);
      return;
    }
    setDayMode("recurring");
    const recurringForDay = recurringBlocks
      .filter((block) => block.day_of_week === weekdayIndex(date))
      .map((block) => ({ start_time: block.start_time, end_time: block.end_time }));
    setDayBlocks(recurringForDay);
  };

  const saveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const saved = await schedulingService.setMyAvailability(recurringBlocks);
      setRecurringBlocks(saved);
      toast({
        title: "Plantilla guardada",
        description: "Los horarios recurrentes se aplican a todas las semanas.",
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: errorMessage(error, "Revisa los horarios e intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const saveDayOverride = async () => {
    if (!selectedDay) return;
    setSavingDay(true);
    try {
      const iso = toIsoDate(selectedDay);
      const saved = await schedulingService.setDateOverride(
        iso,
        dayMode,
        dayMode === "custom" ? dayBlocks : []
      );
      setOverrides((prev) => {
        const rest = prev.filter((item) => item.date !== iso);
        if (saved.mode === "recurring") return rest;
        return [...rest, saved];
      });
      toast({
        title: "Día actualizado",
        description:
          dayMode === "unavailable"
            ? "Ese día quedó bloqueado para citas."
            : dayMode === "custom"
              ? "Horario personalizado guardado para este día."
              : "Se usará la plantilla semanal para este día.",
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar el día",
        description: errorMessage(error, "Intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setSavingDay(false);
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
        description: errorMessage(error, "Intenta de nuevo"),
        variant: "destructive",
      });
    }
  };

  const addRecurringBlock = (dayOfWeek: number) => {
    setRecurringBlocks((prev) => [
      ...prev,
      { day_of_week: dayOfWeek, start_time: "09:00", end_time: "12:00" },
    ]);
  };

  const updateRecurringBlock = (index: number, field: keyof AvailabilityBlock, value: string | number) => {
    setRecurringBlocks((prev) =>
      prev.map((block, i) => (i === index ? { ...block, [field]: value } : block))
    );
  };

  const removeRecurringBlock = (index: number) => {
    setRecurringBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const addDayBlock = () => {
    setDayBlocks((prev) => [...prev, { start_time: "09:00", end_time: "12:00" }]);
  };

  const updateDayBlock = (index: number, field: keyof DateTimeBlock, value: string) => {
    setDayBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, [field]: value } : block)));
  };

  const removeDayBlock = (index: number) => {
    setDayBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const goToDayFromMonth = (date: Date) => {
    setMonthlyOpen(false);
    setWeekStart(getWeekStart(date));
    setPendingSelectDay(date);
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

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="w-full h-auto p-1.5 bg-secondary/80 rounded-2xl grid grid-cols-2 gap-1">
          <TabsTrigger value="calendar" className="rounded-xl py-2.5 gap-2 data-[state=active]:bg-card">
            <CalendarDays className="h-4 w-4" /> Calendario
          </TabsTrigger>
          <TabsTrigger value="template" className="rounded-xl py-2.5 gap-2 data-[state=active]:bg-card">
            <Repeat className="h-4 w-4" /> Plantilla semanal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4 mt-0">
          <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-primary text-lg">Calendario de atención</h3>
                <p className="text-xs text-muted-foreground">
                  Semana del {weekRangeLabel} · Haz clic en un día para personalizarlo
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setMonthlyOpen(true)}>
                  <LayoutGrid className="h-4 w-4" /> Vista mensual
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; })}>
                  ← Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekStart(getWeekStart())}>Hoy</Button>
                <Button variant="outline" size="sm" onClick={() => setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; })}>
                  Siguiente →
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mb-5 text-xs">
              {(["recurring", "custom", "unavailable", "empty"] as const).map((mode) => {
                const LegendIcon = MODE_STYLES[mode].icon;
                return (
                  <span
                    key={mode}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-medium",
                      MODE_STYLES[mode].badge
                    )}
                  >
                    <LegendIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{MODE_STYLES[mode].label}</span>
                  </span>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weekDays.map((day, index) => {
                const isPast = isPastDay(day);
                const mode = getDayDisplayMode(day, recurringBlocks, overrides);
                const style = MODE_STYLES[mode];
                const ModeIcon = style.icon;
                const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.scheduled_at), day));
                const effectiveBlocks = isPast ? [] : getEffectiveBlocks(day, recurringBlocks, overrides);
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={toIsoDate(day)}
                    type="button"
                    onClick={() => !isPast && selectDay(day)}
                    disabled={isPast}
                    className={cn(
                      "rounded-2xl border p-2.5 sm:p-3 min-h-[160px] min-w-0 w-full text-left transition-smooth overflow-hidden",
                      !isPast && "hover:shadow-soft",
                      style.card,
                      isPast && "opacity-70 cursor-default",
                      isSelected && !isPast && "ring-2 ring-primary ring-offset-2",
                      isToday && !isSelected && "ring-1 ring-primary/50"
                    )}
                  >
                    <div className="flex flex-col gap-1.5 sm:gap-2 mb-2 min-w-0">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
                          {DAY_LABELS[index].slice(0, 3)}
                        </div>
                        <div className={cn("text-xl font-bold leading-tight", isToday && "text-primary")}>
                          {day.getDate()}
                        </div>
                      </div>
                      {!isPast && (
                        <span
                          title={style.label}
                          className={cn(
                            "inline-flex items-center gap-1 max-w-full self-start text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
                            style.badge
                          )}
                        >
                          <ModeIcon className="h-3 w-3 shrink-0" />
                          <span className="leading-none truncate">{style.shortLabel}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 sm:space-y-1 mb-2 min-w-0">
                      {isPast ? (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Día pasado</p>
                      ) : effectiveBlocks.length === 0 ? (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Sin horarios</p>
                      ) : (
                        effectiveBlocks.map((block, blockIndex) => (
                          <p
                            key={blockIndex}
                            className="text-[9px] sm:text-[10px] font-medium text-foreground/80 leading-tight truncate tabular-nums"
                          >
                            {formatBlockTime(block.start_time, block.end_time)}
                          </p>
                        ))
                      )}
                    </div>

                    {dayAppointments.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-border/50">
                        {dayAppointments.map((appointment) => (
                          <div key={appointment.id} className="text-[10px] rounded-lg bg-card/80 px-2 py-1 border border-border/50">
                            <span className="font-bold">{formatTime(appointment.scheduled_at)}</span>
                            <span className="text-muted-foreground"> · {appointment.patient_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDay && (
            <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
              <h3 className="font-display font-bold text-primary text-lg mb-1">
                Configurar {selectedDay.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Personaliza este día sin afectar la plantilla semanal general.
              </p>

              <div className="grid sm:grid-cols-3 gap-2 mb-4">
                {([
                  { mode: "recurring" as const, label: "Usar plantilla", icon: Repeat },
                  { mode: "custom" as const, label: "Horario personalizado", icon: CalendarDays },
                  { mode: "unavailable" as const, label: "No disponible", icon: Ban },
                ]).map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => {
                      setDayMode(option.mode);
                      if (option.mode === "custom" && dayBlocks.length === 0) {
                        setDayBlocks([{ start_time: "09:00", end_time: "12:00" }]);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-smooth",
                      dayMode === option.mode
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-soft hover:bg-secondary"
                    )}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              {dayMode === "custom" && (
                <div className="space-y-2 mb-4">
                  {dayBlocks.map((block, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={block.start_time}
                        onChange={(e) => updateDayBlock(index, "start_time", e.target.value)}
                        className="bg-soft rounded-xl px-3 py-2 text-sm border border-border outline-none"
                      />
                      <span className="text-muted-foreground text-sm">a</span>
                      <input
                        type="time"
                        value={block.end_time}
                        onChange={(e) => updateDayBlock(index, "end_time", e.target.value)}
                        className="bg-soft rounded-xl px-3 py-2 text-sm border border-border outline-none"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeDayBlock(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addDayBlock}>
                    <Plus className="h-4 w-4" /> Agregar bloque
                  </Button>
                </div>
              )}

              {dayMode === "recurring" && (
                <p className="text-sm text-muted-foreground mb-4">
                  Se aplicarán los horarios de la plantilla para los{" "}
                  {DAY_LABELS[weekdayIndex(selectedDay)].toLowerCase()}.
                </p>
              )}

              {dayMode === "unavailable" && (
                <p className="text-sm text-muted-foreground mb-4">
                  Los pacientes no podrán agendar citas en esta fecha.
                </p>
              )}

              <Button variant="hero" size="sm" onClick={saveDayOverride} disabled={savingDay}>
                {savingDay ? "Guardando…" : "Guardar este día"}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="template" className="space-y-4 mt-0">
          <div className="bg-card rounded-3xl shadow-soft border border-border p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div>
                <h3 className="font-display font-bold text-primary text-lg">Plantilla semanal recurrente</h3>
                <p className="text-xs text-muted-foreground">
                  Estos horarios se repiten cada semana. Puedes sobrescribir días específicos desde el calendario.
                </p>
              </div>
              <Button variant="hero" size="sm" onClick={saveTemplate} disabled={savingTemplate}>
                {savingTemplate ? "Guardando…" : "Guardar plantilla"}
              </Button>
            </div>

            <div className="space-y-4">
              {DAY_LABELS.map((label, dayIndex) => {
                const dayBlocks = recurringBlocks
                  .map((block, index) => ({ block, index }))
                  .filter(({ block }) => block.day_of_week === dayIndex);

                return (
                  <div key={label} className="rounded-2xl border border-border p-4 bg-soft/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-primary" />
                        {label}
                      </h4>
                      <Button variant="outline" size="sm" onClick={() => addRecurringBlock(dayIndex)}>
                        <Plus className="h-4 w-4" /> Agregar bloque
                      </Button>
                    </div>

                    {dayBlocks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin horarios recurrentes.</p>
                    ) : (
                      <div className="space-y-2">
                        {dayBlocks.map(({ block, index }) => (
                          <div key={`${dayIndex}-${index}`} className="flex flex-wrap items-center gap-2">
                            <input
                              type="time"
                              value={block.start_time}
                              onChange={(e) => updateRecurringBlock(index, "start_time", e.target.value)}
                              className="bg-card rounded-xl px-3 py-2 text-sm border border-border outline-none"
                            />
                            <span className="text-muted-foreground text-sm">a</span>
                            <input
                              type="time"
                              value={block.end_time}
                              onChange={(e) => updateRecurringBlock(index, "end_time", e.target.value)}
                              className="bg-card rounded-xl px-3 py-2 text-sm border border-border outline-none"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeRecurringBlock(index)}>
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
        </TabsContent>
      </Tabs>

      <MonthlyAvailabilityDialog
        open={monthlyOpen}
        onOpenChange={setMonthlyOpen}
        recurringBlocks={recurringBlocks}
        appointments={appointments}
        onDaySelect={goToDayFromMonth}
      />

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
            {appointments.map((appointment) => {
              const canCompleteByTime = appointmentHasEnded(appointment.scheduled_at);

              return (
              <div key={appointment.id} className="flex items-center gap-4 p-4 rounded-2xl bg-soft border border-border">
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[3.25rem] px-2 py-2.5 rounded-2xl bg-primary/10 text-primary gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="text-xs font-bold tabular-nums leading-none whitespace-nowrap">
                    {formatTime(appointment.scheduled_at)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    {appointment.patient_name}
                    {newAppointmentIds.has(appointment.id) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">NUEVA</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.topic} · {formatDate(appointment.scheduled_at)}
                  </div>
                  {appointment.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{appointment.notes}</p>
                  )}
                  {!canCompleteByTime && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Podrás completarla cuando termine el horario de la cita.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canCompleteByTime}
                  title={
                    canCompleteByTime
                      ? "Debes enviar al menos un mensaje al paciente antes de completar"
                      : "Disponible cuando finalice el horario de la cita"
                  }
                  onClick={() => completeAppointment(appointment.id)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Completar
                </Button>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
