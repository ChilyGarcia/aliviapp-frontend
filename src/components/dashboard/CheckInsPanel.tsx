import { useState } from "react";
import { Heart, Flame, TrendingUp, Calendar, Plus, Smile, Meh, Frown, Angry, Laugh, Check, Sparkles, Moon, Brain, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MoodOption {
  key: string;
  label: string;
  icon: typeof Smile;
  score: number;
  color: string;
  bg: string;
  ring: string;
}

interface CheckInEntry {
  id: number;
  date: string;
  day: string;
  mood: string;
  score: number;
  energy: number;
  stress: number;
  sleep: number;
  tags: string[];
  note?: string;
}

const moods: MoodOption[] = [
  { key: "great", label: "Excelente", icon: Laugh, score: 5, color: "text-success", bg: "bg-success/15", ring: "ring-success" },
  { key: "good", label: "Bien", icon: Smile, score: 4, color: "text-primary", bg: "bg-primary/15", ring: "ring-primary" },
  { key: "okay", label: "Neutral", icon: Meh, score: 3, color: "text-accent", bg: "bg-accent/15", ring: "ring-accent" },
  { key: "low", label: "Bajo", icon: Frown, score: 2, color: "text-warning", bg: "bg-warning/15", ring: "ring-warning" },
  { key: "bad", label: "Muy mal", icon: Angry, score: 1, color: "text-destructive", bg: "bg-destructive/15", ring: "ring-destructive" },
];

const moodTags = [
  "Trabajo", "Familia", "Sueño", "Ansiedad", "Motivado", "Cansado",
  "Agradecido", "Estresado", "Enfocado", "Triste", "Tranquilo", "Frustrado",
];

const recentEntries: CheckInEntry[] = [
  { id: 1, date: "25 abr", day: "Hoy", mood: "good", score: 4, energy: 7, stress: 4, sleep: 7, tags: ["Enfocado", "Trabajo"], note: "Buena reunión con el equipo." },
  { id: 2, date: "24 abr", day: "Ayer", mood: "okay", score: 3, energy: 5, stress: 6, sleep: 6, tags: ["Cansado", "Ansiedad"] },
  { id: 3, date: "23 abr", day: "Mié", mood: "great", score: 5, energy: 8, stress: 3, sleep: 8, tags: ["Agradecido", "Familia"] },
  { id: 4, date: "22 abr", day: "Mar", mood: "good", score: 4, energy: 7, stress: 4, sleep: 7, tags: ["Tranquilo"] },
  { id: 5, date: "21 abr", day: "Lun", mood: "low", score: 2, energy: 4, stress: 7, sleep: 5, tags: ["Estresado", "Trabajo"] },
  { id: 6, date: "20 abr", day: "Dom", mood: "good", score: 4, energy: 6, stress: 4, sleep: 8, tags: ["Tranquilo", "Familia"] },
  { id: 7, date: "19 abr", day: "Sáb", mood: "great", score: 5, energy: 9, stress: 2, sleep: 8, tags: ["Motivado"] },
];

const weekChart = [4, 2, 4, 5, 3, 4, 4]; // L M X J V S D scores 1-5

export const CheckInsPanel = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submit = () => {
    if (!selectedMood) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setSelectedMood(null);
    setActiveTags([]);
    setNote("");
  };

  const avgScore = (recentEntries.reduce((a, b) => a + b.score, 0) / recentEntries.length).toFixed(1);
  const streak = 7;
  const totalCheckIns = 24;
  const days = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* HERO STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-hero text-primary-foreground rounded-3xl p-6 shadow-elegant relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-white/80">
              <Flame className="h-4 w-4 text-accent" /> Racha actual
            </div>
            <div className="font-display font-extrabold text-5xl mt-2">{streak}</div>
            <div className="text-white/80 text-sm">días consecutivos cuidando tu bienestar 💙</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-success" /> Promedio semanal
          </div>
          <div className="font-display font-extrabold text-5xl mt-2 text-primary">{avgScore}<span className="text-2xl text-muted-foreground">/5</span></div>
          <div className="text-sm text-success font-medium mt-1">+0.4 vs. semana anterior</div>
        </div>
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold text-muted-foreground">
            <Calendar className="h-4 w-4 text-accent" /> Total registros
          </div>
          <div className="font-display font-extrabold text-5xl mt-2 text-primary">{totalCheckIns}</div>
          <div className="text-sm text-muted-foreground mt-1">desde que iniciaste</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* NEW CHECK-IN FORM */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-primary text-xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-cta" /> Check-in de hoy
              </h3>
              <p className="text-sm text-muted-foreground mt-1">¿Cómo te sientes en este momento? Tarda menos de 1 minuto.</p>
            </div>
            {submitted && (
              <div className="flex items-center gap-2 bg-success/15 text-success px-3 py-1.5 rounded-full text-sm font-semibold animate-fade-in">
                <Check className="h-4 w-4" /> Registrado
              </div>
            )}
          </div>

          {/* MOOD PICKER */}
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
                  <span className={cn("text-[11px] font-semibold", selectedMood === m.key ? m.color : "text-muted-foreground")}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SLIDERS */}
          <div className="grid sm:grid-cols-3 gap-5 mt-6">
            {[
              { label: "Energía", value: energy, setter: setEnergy, icon: Activity, color: "accent" },
              { label: "Estrés", value: stress, setter: setStress, icon: Brain, color: "warning" },
              { label: "Sueño (h)", value: sleep, setter: setSleep, icon: Moon, color: "primary", max: 12 },
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

          {/* TAGS */}
          <div className="mt-6">
            <label className="text-sm font-semibold text-foreground mb-3 block">¿Qué influyó en tu día? <span className="text-muted-foreground font-normal">(opcional)</span></label>
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

          {/* NOTE */}
          <div className="mt-6">
            <label className="text-sm font-semibold text-foreground mb-2 block">Nota personal <span className="text-muted-foreground font-normal">(privada)</span></label>
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
            disabled={!selectedMood}
            onClick={submit}
          >
            <Check className="h-4 w-4" /> Guardar check-in
          </Button>
        </div>

        {/* WEEKLY CHART + INSIGHTS */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-bold text-primary">Esta semana</h4>
              <span className="text-xs text-muted-foreground">Lun-Dom</span>
            </div>
            <div className="flex items-end justify-between h-32 gap-2">
              {weekChart.map((v, i) => {
                const mood = moods.find((m) => m.score === v) ?? moods[2];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className={cn("w-full rounded-t-lg transition-smooth", mood.bg.replace("/15", ""))}
                        style={{ height: `${(v / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground">{days[i]}</span>
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
              <p className="text-white/90 text-sm leading-relaxed">
                Tu bienestar mejora los días con <strong>+7h de sueño</strong>. Considera mantener una rutina nocturna estable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORY */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-primary text-lg">Historial reciente</h3>
          <Button variant="ghost" size="sm">Ver todo</Button>
        </div>
        <div className="divide-y divide-border">
          {recentEntries.map((e) => {
            const m = moods.find((x) => x.key === e.mood)!;
            return (
              <div key={e.id} className="py-4 flex items-start gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0", m.bg)}>
                  <m.icon className={cn("h-6 w-6", m.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{e.day}</span>
                    <span className="text-xs text-muted-foreground">· {e.date}</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", m.bg, m.color)}>{m.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1.5">
                    <span>⚡ Energía {e.energy}/10</span>
                    <span>🧠 Estrés {e.stress}/10</span>
                    <span>🌙 {e.sleep}h sueño</span>
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
      </div>
    </div>
  );
};
