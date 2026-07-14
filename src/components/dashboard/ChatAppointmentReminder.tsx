import { Calendar, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/scheduling.types";

const formatAppointmentDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const formatAppointmentTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });

const getUpcomingAppointments = (
  appointments: Appointment[],
  participantId: string,
  matchField: "patient_id" | "professional_id"
) =>
  appointments
    .filter(
      (appointment) =>
        appointment.status === "SCHEDULED" && appointment[matchField] === participantId
    )
    .sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

interface ChatAppointmentReminderProps {
  appointments: Appointment[];
  participantId: string;
  participantName: string;
  matchField: "patient_id" | "professional_id";
  className?: string;
}

export const ChatAppointmentReminder = ({
  appointments,
  participantId,
  participantName,
  matchField,
  className,
}: ChatAppointmentReminderProps) => {
  const upcoming = getUpcomingAppointments(appointments, participantId, matchField);

  if (upcoming.length === 0) return null;

  const headline = `Tienes una cita con ${participantName}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative h-9 w-9 rounded-full shrink-0", className)}
          title="Ver cita agendada"
          aria-label="Recordatorio de cita agendada"
        >
          <Calendar className="h-4 w-4 text-primary" />
          <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-cta ring-2 ring-card" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-4 shadow-elegant">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{headline}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {upcoming.length === 1
                ? "Próxima sesión agendada"
                : `${upcoming.length} sesiones agendadas`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {upcoming.slice(0, 3).map((appointment) => (
            <div
              key={appointment.id}
              className="rounded-xl border border-border bg-soft/70 p-3 space-y-1.5"
            >
              <p className="text-sm font-semibold text-primary">{appointment.topic}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {formatAppointmentDate(appointment.scheduled_at)}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {formatAppointmentTime(appointment.scheduled_at)}
              </p>
              {appointment.notes && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-1">
                  <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{appointment.notes}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        {upcoming.length > 3 && (
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            +{upcoming.length - 3} cita{upcoming.length - 3 === 1 ? "" : "s"} más en tu agenda
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export const hasUpcomingAppointment = (
  appointments: Appointment[],
  participantId: string,
  matchField: "patient_id" | "professional_id"
) => getUpcomingAppointments(appointments, participantId, matchField).length > 0;
