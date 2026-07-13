import { Bell, AlertTriangle, Heart, Calendar, X, Plus, Clock, FileText, User, CalendarPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Alert {
  id: number;
  type: "info" | "warn" | "success" | "session";
  icon: typeof Bell;
  title: string;
  desc: string;
  time: string;
}

const initial: Alert[] = [
  { id: 1, type: "warn", icon: AlertTriangle, title: "Recordatorio de bienestar", desc: "Has tenido una semana intensa. Tómate 5 minutos para respirar profundamente.", time: "Hace 10 min" },
  { id: 2, type: "info", icon: Calendar, title: "Sesión recomendada", desc: "Tu psicóloga sugiere una sesión de seguimiento esta semana.", time: "Hace 2 h" },
  { id: 3, type: "success", icon: Heart, title: "Logro desbloqueado", desc: "Completaste 7 días seguidos de check-in emocional. ¡Sigue así!", time: "Ayer" },
  { id: 4, type: "info", icon: Bell, title: "Nuevo recurso disponible", desc: "Guía de manejo de estrés laboral añadida a tu biblioteca.", time: "Hace 2 días" },
];

const styles: Record<Alert["type"], string> = {
  warn: "bg-warning/10 text-warning border-warning/20",
  info: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  session: "bg-cta/15 text-cta border-cta/30",
};

const professionals = [
  "Dra. Camila Rojas — Psicología Clínica",
  "Dr. Andrés Patiño — Psicología Ocupacional",
  "Dra. Lucía Fernández — Terapia Cognitiva",
  "Dr. Mateo Herrera — Manejo de Crisis",
];

export const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<Alert[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    professional: "",
    date: "",
    time: "",
    modality: "chat",
    topic: "",
    notes: "",
    reminder: "30",
  });

  const resetForm = () => setForm({
    professional: "", date: "", time: "", modality: "chat", topic: "", notes: "", reminder: "30",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.professional || !form.date || !form.time || !form.topic) {
      toast({ title: "Faltan datos", description: "Completa profesional, fecha, hora y tema." });
      return;
    }
    const newAlert: Alert = {
      id: Date.now(),
      type: "session",
      icon: CalendarPlus,
      title: `Sesión agendada · ${form.topic}`,
      desc: `Con ${form.professional.split(" — ")[0]} el ${form.date} a las ${form.time}. Recordatorio ${form.reminder} min antes.`,
      time: "Hace un momento",
    };
    setAlerts((a) => [newAlert, ...a]);
    toast({
      title: "Sesión creada ✓",
      description: "Tu psicólogo recibirá tu preparación previa para optimizar la sesión.",
    });
    setOpen(false);
    resetForm();
  };

  return (
    <div className="max-w-3xl space-y-3">
      {/* HEADER */}
      <div className="bg-card-grad rounded-2xl border border-border p-5 shadow-soft mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-display font-bold text-primary">Centro de notificaciones</div>
          <p className="text-sm text-muted-foreground">Alertas, recordatorios y sesiones agendadas.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-cta text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">{alerts.length}</span>

          {/* CREATE SESSION */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="sm">
                <Plus className="h-4 w-4" /> Crear sesión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-primary flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5 text-cta" /> Agendar / preparar sesión
                </DialogTitle>
                <DialogDescription>
                  Programa una sesión y prepara con anticipación los temas que quieres tratar con tu psicólogo.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Profesional</Label>
                  <Select
                    value={form.professional}
                    onValueChange={(v) => setForm({ ...form, professional: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona un profesional" /></SelectTrigger>
                    <SelectContent>
                      {professionals.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Fecha</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Hora</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Modalidad</Label>
                    <Select value={form.modality} onValueChange={(v) => setForm({ ...form, modality: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chat">💬 Chat</SelectItem>
                        <SelectItem value="video">🎥 Videollamada</SelectItem>
                        <SelectItem value="audio">🎧 Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recordarme</Label>
                    <Select value={form.reminder} onValueChange={(v) => setForm({ ...form, reminder: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Notas previas (opcional)</Label>
                  <Textarea
                    placeholder="Describe lo que has sentido, situaciones puntuales o preguntas que quieres hacer. Esto le llegará a tu psicólogo antes de la sesión."
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="bg-secondary/60 border border-border rounded-xl p-3 text-xs text-muted-foreground flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  Recibirás una alerta automática y tu profesional contará con tu preparación previa para aprovechar mejor la sesión.
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero">
                    <CalendarPlus className="h-4 w-4" /> Agendar sesión
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* LIST */}
      {alerts.map((a) => (
        <div key={a.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 shadow-soft hover:shadow-elegant transition-smooth">
          <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${styles[a.type]}`}>
            <a.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground">{a.title}</h4>
              <button
                onClick={() => setAlerts((all) => all.filter((x) => x.id !== a.id))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{a.time}</span>
              <Button variant="ghost" size="sm" className="text-primary">Ver detalle</Button>
            </div>
          </div>
        </div>
      ))}

      {alerts.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No tienes alertas pendientes 🌿</div>
      )}
    </div>
  );
};
