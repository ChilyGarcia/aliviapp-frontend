import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isPastDay } from "@/lib/scheduling-dates";
import { schedulingService } from "@/services/scheduling.service";
import type {
  Appointment,
  AvailabilityBlock,
  DateAvailabilityOverride,
  DateOverrideMode,
  DateTimeBlock,
} from "@/types/scheduling.types";
import { Ban, CalendarDays, ChevronLeft, ChevronRight, Clock, Repeat } from "lucide-react";

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getDefaultFocusDay = (monthDate: Date) => {
  const today = new Date();
  if (isSameMonth(today, monthDate)) return today;
  return new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
};

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
    cell: "border-primary/40 bg-primary/10 hover:bg-primary/15",
    badge: "bg-primary/20 text-primary",
    dot: "bg-primary",
    icon: Repeat,
  },
  custom: {
    label: "Personalizado",
    cell: "border-success/40 bg-success/10 hover:bg-success/15",
    badge: "bg-success/20 text-success",
    dot: "bg-success",
    icon: CalendarDays,
  },
  unavailable: {
    label: "No disponible",
    cell: "border-destructive/30 bg-destructive/10 hover:bg-destructive/15",
    badge: "bg-destructive/20 text-destructive",
    dot: "bg-destructive",
    icon: Ban,
  },
  empty: {
    label: "Sin horario",
    cell: "border-border bg-muted/30 hover:bg-muted/50",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
    icon: Clock,
  },
  past: {
    label: "Pasado",
    cell: "border-border/50 bg-muted/20",
    badge: "bg-muted/80 text-muted-foreground",
    dot: "bg-muted-foreground/30",
    icon: Clock,
  },
} as const;

const getCalendarGridDays = (month: Date) => {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - weekdayIndex(firstOfMonth));

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
};

const getGridRange = (month: Date) => {
  const days = getCalendarGridDays(month);
  return { from: toIsoDate(days[0]), to: toIsoDate(days[days.length - 1]) };
};

const getDayDisplayMode = (
  date: Date,
  recurring: AvailabilityBlock[],
  overrides: DateAvailabilityOverride[]
) => {
  if (isPastDay(date)) return "past" as const;
  return getEffectiveMode(date, recurring, overrides);
};

interface MonthlyAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringBlocks: AvailabilityBlock[];
  appointments: Appointment[];
  onDaySelect: (date: Date) => void;
}

export const MonthlyAvailabilityDialog = ({
  open,
  onOpenChange,
  recurringBlocks,
  appointments,
  onDaySelect,
}: MonthlyAvailabilityDialogProps) => {
  const [month, setMonth] = useState(() => new Date());
  const [overrides, setOverrides] = useState<DateAvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedDay, setFocusedDay] = useState<Date | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const calendarDays = useMemo(() => getCalendarGridDays(month), [month]);
  const today = new Date();
  const viewingCurrentMonth = isSameMonth(month, today);
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const monthName = capitalize(month.toLocaleDateString("es-CO", { month: "long" }));
  const yearLabel = month.getFullYear().toString();

  useEffect(() => {
    if (!open) return;

    const now = new Date();
    setMonth(now);
    setFocusedDay(now);
    setSlideDirection("right");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const { from, to } = getGridRange(month);
    setLoading(true);
    schedulingService
      .listDateOverrides(from, to)
      .then(setOverrides)
      .catch(() => setOverrides([]))
      .finally(() => setLoading(false));
  }, [open, month]);

  useEffect(() => {
    if (!open) return;
    setFocusedDay(getDefaultFocusDay(month));
  }, [month]);

  const goToPreviousMonth = useCallback(() => {
    setSlideDirection("left");
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSlideDirection("right");
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setSlideDirection(now > month ? "right" : "left");
    setMonth(now);
    setFocusedDay(now);
  }, [month]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousMonth();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextMonth();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPreviousMonth, goToNextMonth]);

  const previewDay = focusedDay && isSameMonth(focusedDay, month) ? focusedDay : null;
  const previewMode = previewDay
    ? getDayDisplayMode(previewDay, recurringBlocks, overrides)
    : null;
  const previewBlocks = previewDay && !isPastDay(previewDay)
    ? getEffectiveBlocks(previewDay, recurringBlocks, overrides)
    : [];
  const previewAppointments = previewDay
    ? appointments.filter((appointment) => isSameDay(new Date(appointment.scheduled_at), previewDay))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "grid grid-rows-[auto_auto_minmax(0,1fr)_auto]",
          "w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-4xl",
          "max-h-[92dvh] p-0 gap-0 overflow-hidden",
          "top-[4dvh] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]",
          "sm:rounded-2xl"
        )}
      >
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-5 pb-3 sm:pt-6 sm:pb-4 border-b border-border pr-12">
          <DialogTitle className="font-display text-primary text-lg sm:text-xl">
            Vista mensual de disponibilidad
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Usa las flechas para cambiar de mes. Haz clic en un día para editarlo en la vista
            semanal.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-border bg-soft/40">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0"
              onClick={goToPreviousMonth}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="w-full max-w-xs rounded-2xl border border-primary/20 bg-card px-4 sm:px-6 py-2.5 sm:py-3 shadow-soft text-center">
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {yearLabel}
                </p>
                <p
                  key={monthKey}
                  className={cn(
                    "font-display font-bold text-xl sm:text-2xl text-primary capitalize mt-0.5",
                    "animate-in fade-in duration-300",
                    slideDirection === "right" ? "slide-in-from-right-3" : "slide-in-from-left-3"
                  )}
                >
                  {monthName}
                </p>
              </div>

              {!viewingCurrentMonth && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={goToToday}
                  className="mt-1.5 h-auto p-0 text-xs text-primary font-semibold"
                >
                  Volver al mes actual
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0"
              onClick={goToNextMonth}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mb-3">
            ← Mes anterior · Mes siguiente →
            <span className="hidden sm:inline"> · También puedes usar las flechas del teclado</span>
          </p>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            {(["recurring", "custom", "unavailable", "empty"] as const).map((mode) => {
              const LegendIcon = MODE_STYLES[mode].icon;
              return (
                <span
                  key={mode}
                  className={cn(
                    "inline-flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium",
                    MODE_STYLES[mode].badge
                  )}
                >
                  <LegendIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="truncate">{MODE_STYLES[mode].label}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-2 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
            {WEEKDAY_HEADERS.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-1"
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.charAt(0)}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-12 sm:py-16 text-center text-sm text-muted-foreground">
              Cargando {monthName}…
            </div>
          ) : (
            <div
              key={monthKey}
              className={cn(
                "grid grid-cols-7 gap-1 sm:gap-2 pb-2",
                "animate-in fade-in duration-300",
                slideDirection === "right" ? "slide-in-from-right-4" : "slide-in-from-left-4"
              )}
            >
              {calendarDays.map((day) => {
                const isPast = isPastDay(day);
                const mode = getDayDisplayMode(day, recurringBlocks, overrides);
                const style = MODE_STYLES[mode];
                const blocks = isPast ? [] : getEffectiveBlocks(day, recurringBlocks, overrides);
                const dayAppointments = appointments.filter((appointment) =>
                  isSameDay(new Date(appointment.scheduled_at), day)
                );
                const isCurrentMonth = day.getMonth() === month.getMonth();
                const isToday = isSameDay(day, today);
                const isFocused = previewDay ? isSameDay(day, previewDay) : false;

                return (
                  <button
                    key={toIsoDate(day)}
                    type="button"
                    onClick={() => !isPast && isCurrentMonth && onDaySelect(day)}
                    onMouseEnter={() => isCurrentMonth && setFocusedDay(day)}
                    onFocus={() => isCurrentMonth && setFocusedDay(day)}
                    disabled={isPast || !isCurrentMonth}
                    className={cn(
                      "rounded-lg sm:rounded-xl border p-1 sm:p-2 min-h-[52px] sm:min-h-[72px] lg:min-h-[84px]",
                      "text-left transition-smooth overflow-hidden flex flex-col gap-0.5 sm:gap-1",
                      isCurrentMonth ? style.cell : "border-border/40 bg-muted/10",
                      isCurrentMonth && !isPast && "hover:shadow-soft",
                      (isPast || !isCurrentMonth) && "opacity-50 cursor-default",
                      isToday && isCurrentMonth && "ring-2 ring-primary ring-offset-1",
                      isFocused && !isPast && isCurrentMonth && "ring-1 ring-primary/60 shadow-soft"
                    )}
                  >
                    <div className="flex items-start justify-between gap-0.5">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-bold leading-none",
                          isToday && isCurrentMonth ? "text-primary" : "text-foreground"
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {isCurrentMonth && !isPast && (
                        <span className={cn("h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0 mt-0.5", style.dot)} />
                      )}
                    </div>

                    {!isCurrentMonth ? (
                      <p className="hidden sm:block text-[10px] text-muted-foreground leading-tight">
                        {capitalize(day.toLocaleDateString("es-CO", { month: "short" }))}
                      </p>
                    ) : isPast ? (
                      <p className="hidden sm:block text-[10px] text-muted-foreground leading-tight">
                        Día pasado
                      </p>
                    ) : blocks.length > 0 ? (
                      <div className="hidden sm:block space-y-0.5 min-w-0">
                        <p className="text-[10px] font-medium text-foreground/80 leading-tight truncate">
                          {blocks[0].start_time} – {blocks[0].end_time}
                        </p>
                        {blocks.length > 1 && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            +{blocks.length - 1} bloque{blocks.length - 1 === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="hidden sm:block text-[10px] text-muted-foreground leading-tight truncate">
                        {mode === "unavailable" ? "Bloqueado" : "Sin horario"}
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap gap-1">
                      {isCurrentMonth && !isPast && blocks.length > 0 && (
                        <span className="sm:hidden text-[9px] font-medium text-foreground/70 leading-none">
                          {blocks.length} bloque{blocks.length === 1 ? "" : "s"}
                        </span>
                      )}
                      {isCurrentMonth && dayAppointments.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] font-semibold text-primary bg-primary/10 px-1 sm:px-1.5 py-0.5 rounded-full leading-none">
                          {dayAppointments.length} cita{dayAppointments.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {previewDay && previewMode ? (
          <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-card">
            <p className="text-xs text-muted-foreground mb-1">
              Detalle del día seleccionado en {monthName}
            </p>
            <p className="text-sm font-semibold text-foreground mb-1 line-clamp-2">
              {previewDay.toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              <span className="text-muted-foreground font-normal">
                {" "}
                · {MODE_STYLES[previewMode].label}
              </span>
            </p>
            {previewBlocks.length > 0 ? (
              <p className="text-xs text-muted-foreground line-clamp-2">
                Horarios: {previewBlocks.map((b) => `${b.start_time}–${b.end_time}`).join(", ")}
              </p>
            ) : isPastDay(previewDay) ? (
              <p className="text-xs text-muted-foreground">
                Este día ya pasó. No se puede modificar disponibilidad.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Sin bloques de atención configurados.</p>
            )}
            {previewAppointments.length > 0 && (
              <p className="text-xs text-primary mt-1">
                {previewAppointments.length} cita{previewAppointments.length === 1 ? "" : "s"} agendada
                {previewAppointments.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        ) : (
          <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-border bg-card/80">
            <p className="text-xs text-muted-foreground text-center">
              Pasa el cursor sobre un día de {monthName} para ver su detalle
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
