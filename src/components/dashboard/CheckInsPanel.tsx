import { useEffect, useState } from "react";
import {
  Heart, Flame, TrendingUp, Calendar, Smile, Meh, Frown, Angry, Laugh,
  Check, Sparkles, Moon, Brain, Activity, RefreshCw, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { checkInsService } from "@/services/checkins.service";
import type { CheckIn, CheckInSummary, MoodKey } from "@/types/checkin.types";

interface MoodOption {
  key: MoodKey;
  label: string;
  icon: typeof Smile;
  color: string;
  bg: string;
}

const moods: MoodOption[] = [
  { key: "great", label: "Excelente", icon: Laugh, color: "text-success", bg: "bg-success/15" },
  { key: "good", label: "Bien", icon: Smile, color: "text-primary", bg: "bg-primary/15" },
  { key: "okay", label: "Neutral", icon: Meh, color: "text-accent", bg: "bg-accent/15" },
  { key: "low", label: "Bajo", icon: Frown, color: "text-warning", bg: "bg-warning/15" },
  { key: "bad", label: "Muy mal", icon: Angry, color: "text-destructive", bg: "bg-destructive/15" },
];

const moodTags = [
  "Trabajo", "Familia", "Sueño", "Ansiedad", "Motivado", "Cansado",
  "Agradecido", "Estresado", "Enfocado", "Triste", "Tranquilo", "Frustrado",
];

const days = ["L", "M", "X", "J", "V", "S", "D"];

/** Colores sólidos para la gráfica — deben estar escritos literalmente para que Tailwind los compile */
const CHART_BAR_COLORS: Record<number, string> = {
  5: "bg-success",
  4: "bg-primary",
  3: "bg-accent",
  2: "bg-warning",
  1: "bg-destructive",
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatDayLabel = (iso: string): { day: string; date: string } => {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86400000);

  const formattedDate = date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });

  if (diffDays === 0) return { day: "Hoy", date: formattedDate };
  if (diffDays === 1) return { day: "Ayer", date: formattedDate };
  const weekday = date.toLocaleDateString("es-CO", { weekday: "short" });
  return { day: weekday.charAt(0).toUpperCase() + weekday.slice(1, 3), date: formattedDate };
};

export const CheckInsPanel = () => {
  const [summary, setSummary] = useState<CheckInSummary | null>(null);
  const [entries, setEntries] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [summaryData, entriesData] = await Promise.all([
        checkInsService.getSummary(),
        checkInsService.list(),
      ]);
      setSummary(summaryData);
      setEntries(entriesData);

      if (summaryData.today_check_in) {
        const today = summaryData.today_check_in;
        setSelectedMood(today.mood);
        setEnergy(today.energy);
        setStress(today.stress);
        setSleep(today.sleep_hours);
        setActiveTags(today.tags);
        setNote(today.note);
      }
    } catch (error) {
      setLoadError(true);
      toast({
        title: "No se pudieron cargar los check-ins",
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

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submit = async () => {
    if (!selectedMood) return;
    setSubmitting(true);
    try {
      await checkInsService.create({
        mood: selectedMood,
        energy,
        stress,
        sleep_hours: sleep,
        tags: activeTags,
        note,
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      await loadData();
    } catch (error) {
      toast({
        title: "No se pudo guardar el check-in",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando check-ins…</div>;
  }

  if (loadError || !summary) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 shadow-soft text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">No pudimos conectar con el servicio de check-ins.</p>
        <Button variant="outline" onClick={() => void loadData()}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  const deltaLabel =
    summary.weekly_average_delta > 0
      ? `+${summary.weekly_average_delta} vs. semana anterior`
      : summary.weekly_average_delta < 0
        ? `${summary.weekly_average_delta} vs. semana anterior`
        : summary.total_check_ins > 0 && summary.weekly_average > 0
          ? "Primera semana con registros"
          : "Sin cambio vs. semana anterior";

  const deltaClass =
    summary.weekly_average_delta > 0
      ? "text-success"
      : summary.weekly_average_delta < 0
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-hero text-primary-foreground rounded-3xl p-6 shadow-elegant relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-white/80">
              <Flame className="h-4 w-4 text-accent" /> Racha actual
            </div>
            <div className="font-display font-extrabold text-5xl mt-2">{summary.streak_days}</div>
            <div className="text-white/80 text-sm">días consecutivos cuidando tu bienestar 💙</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-success" /> Promedio semanal
          </div>
          <div className="font-display font-extrabold text-5xl mt-2 text-primary">
            {summary.weekly_average.toFixed(1)}<span className="text-2xl text-muted-foreground">/5</span>
          </div>
          <div className={cn("text-sm font-medium mt-1", deltaClass)}>{deltaLabel}</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Promedio del ánimo registrado esta semana (escala 1–5)
          </p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            <Calendar className="h-4 w-4 text-accent" /> Total registros
          </div>
          <div className="font-display font-extrabold text-5xl mt-2 text-primary">{summary.total_check_ins}</div>
          <div className="text-sm text-muted-foreground mt-1">desde que iniciaste</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-primary text-xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-cta" /> Check-in de hoy
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.today_check_in
                  ? "Ya registraste tu check-in de hoy. Puedes actualizarlo."
                  : "¿Cómo te sientes en este momento? Tarda menos de 1 minuto."}
              </p>
            </div>
            {submitted && (
              <div className="flex items-center gap-2 bg-success/15 text-success px-3 py-1.5 rounded-full text-sm font-semibold animate-fade-in">
                <Check className="h-4 w-4" /> Registrado
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-3 block">Tu estado de ánimo</label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMood(m.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-smooth",
                    selectedMood === m.key
                      ? `${m.bg} border-current ${m.color}`
                      : "border-border bg-soft hover:border-primary/30"
                  )}
                >
                  <m.icon className={cn("h-7 w-7", selectedMood === m.key ? m.color : "text-muted-foreground")} />
                  <span className={cn("text-[11px] font-semibold", selectedMood === m.key ? m.color : "text-muted-foreground")}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mt-6">
            {[
              { label: "Energía", value: energy, setter: setEnergy, icon: Activity },
              { label: "Estrés", value: stress, setter: setStress, icon: Brain },
              { label: "Sueño (h)", value: sleep, setter: setSleep, icon: Moon, max: 12 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <s.icon className="h-4 w-4 text-muted-foreground" /> {s.label}
                  </label>
                  <span className="text-sm font-bold text-primary">{s.value}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={s.max ?? 10}
                  value={s.value}
                  onChange={(e) => s.setter(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-secondary accent-primary cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold text-foreground mb-3 block">
              ¿Qué influyó en tu día? <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {moodTags.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-smooth",
                    activeTags.includes(t)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-soft text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Nota personal <span className="text-muted-foreground font-normal">(privada)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Escribe algo sobre cómo te sientes..."
              className="w-full bg-soft border border-border rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            disabled={!selectedMood || submitting}
            onClick={() => void submit()}
          >
            <Check className="h-4 w-4" />
            {submitting ? "Guardando…" : summary.today_check_in ? "Actualizar check-in" : "Guardar check-in"}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-bold text-primary">Esta semana</h4>
              <span className="text-xs text-muted-foreground">Lun-Dom</span>
            </div>
            <div className="flex items-end justify-between h-32 gap-2">
              {summary.weekly_chart.map((v, i) => {
                const barColor = v ? CHART_BAR_COLORS[v] ?? "bg-primary" : null;
                const barHeight = v ? Math.max((v / 5) * 100, 18) : 0;
                const jsDay = new Date().getDay();
                const todayChartIndex = jsDay === 0 ? 6 : jsDay - 1;
                const isToday = i === todayChartIndex;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                    <div className="flex-1 w-full flex flex-col items-center justify-end relative min-h-0">
                      {v ? (
                        <>
                          <div
                            className={cn(
                              "absolute -top-1 h-2.5 w-2.5 rounded-full border-2 border-card shadow-sm z-10",
                              barColor
                            )}
                          />
                          <div
                            className={cn("w-full rounded-t-lg transition-smooth min-h-[6px]", barColor)}
                            style={{ height: `${barHeight}%` }}
                            title={`Ánimo: ${v}/5`}
                          />
                        </>
                      ) : (
                        <div className="w-full h-1 rounded-full bg-secondary" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold",
                      isToday ? "text-primary font-bold" : "text-muted-foreground"
                    )}>
                      {days[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-soft relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold mb-3">
                <Sparkles className="h-4 w-4 text-accent" /> Insight IA
              </div>
              <p className="text-white/90 text-sm leading-relaxed">{summary.insight}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-primary text-lg">Historial reciente</h3>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes check-ins registrados.</p>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((e) => {
              const m = moods.find((x) => x.key === e.mood) ?? moods[2];
              const labels = formatDayLabel(e.created_at);
              return (
                <div key={e.id} className="py-4 flex items-start gap-4">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", m.bg)}>
                    <m.icon className={cn("h-6 w-6", m.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{labels.day}</span>
                      <span className="text-xs text-muted-foreground">· {labels.date}</span>
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", m.bg, m.color)}>
                        {e.mood_label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1.5">
                      <span>⚡ Energía {e.energy}/10</span>
                      <span>🧠 Estrés {e.stress}/10</span>
                      <span>🌙 {e.sleep_hours}h sueño</span>
                    </div>
                    {e.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {e.tags.map((t) => (
                          <span key={t} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-semibold">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {e.note && <p className="text-sm text-muted-foreground mt-2 italic">"{e.note}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
