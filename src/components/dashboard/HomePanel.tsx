import { ArrowRight, Clock, Activity, CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFirstName } from "@/utils/user.utils";
import { useGreeting } from "@/hooks/use-greeting";
import { STATS, QUICK_ACTIONS, ACTIVITIES, WELLNESS_TIPS } from "@/constants/dashboard.constants";
import type { TabKey } from "@/types/dashboard.types";

interface HomePanelProps {
  onNavigate: (key: TabKey) => void;
  userName?: string;
}

export const HomePanel = ({ onNavigate, userName }: HomePanelProps) => {
  const greeting = useGreeting();
  const firstName = userName ? getFirstName(userName) : "Usuario";
  const dailyTip = WELLNESS_TIPS[new Date().getDate() % WELLNESS_TIPS.length];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* WELCOME HERO */}
      <div className="bg-hero text-primary-foreground rounded-3xl p-6 lg:p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm bg-white/15 w-fit px-3 py-1.5 rounded-full mb-3">
              <Activity className="h-4 w-4 text-accent" /> Estado: Estable
            </div>
            <h2 className="font-display font-extrabold text-2xl lg:text-4xl">
              {greeting}, {firstName} 👋
            </h2>
            <p className="text-white/85 mt-2 max-w-xl">
              Tu espacio confidencial está listo. Llevas <strong>7 días seguidos</strong> cuidando tu bienestar emocional.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="lg" onClick={() => onNavigate("chat")}>
              <Activity className="h-4 w-4" /> Abrir chat
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => onNavigate("triage")}>
              <Activity className="h-4 w-4" /> Hacer Triage
            </Button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-soft hover:shadow-elegant transition-smooth">
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
        {/* QUICK ACTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary text-lg">Accesos rápidos</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => onNavigate(a.key)}
                  className={`group text-left rounded-2xl p-5 border transition-smooth shadow-soft hover:shadow-elegant hover:-translate-y-1 ${a.gradient
                    ? "bg-cta text-primary-foreground border-transparent"
                    : "bg-card border-border"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${a.gradient ? "bg-white/20" : "bg-primary/10 text-primary"
                      }`}>
                      <a.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className={`h-4 w-4 transition-smooth group-hover:translate-x-1 ${a.gradient ? "text-white/80" : "text-muted-foreground"
                      }`} />
                  </div>
                  <div className={`font-display font-bold mt-4 ${a.gradient ? "" : "text-primary"}`}>{a.title}</div>
                  <div className={`text-sm mt-0.5 ${a.gradient ? "text-white/80" : "text-muted-foreground"}`}>{a.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary text-lg">Actividad reciente</h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("alerts")}>
                Ver todo <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-soft divide-y divide-border">
              {ACTIVITIES.map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-soft transition-smooth">
                  <div className={`h-10 w-10 rounded-xl ${a.bg} ${a.color} flex items-center justify-center shrink-0`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{a.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {a.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* NEXT SESSION */}
          <div className="bg-card-grad border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide mb-3">
              <CalendarCheck className="h-4 w-4" /> Próxima sesión
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-cta flex items-center justify-center font-bold text-primary-foreground">CR</div>
              <div>
                <div className="font-display font-bold text-primary">Dra. Camila Rojas</div>
                <div className="text-xs text-muted-foreground">Psicología clínica</div>
              </div>
            </div>
            <div className="mt-4 bg-secondary rounded-xl p-3 text-sm">
              <div className="font-semibold text-foreground">Mañana · 10:00 AM</div>
              <div className="text-xs text-muted-foreground">Sesión de seguimiento por chat</div>
            </div>
            <Button variant="hero" size="sm" className="w-full mt-3" onClick={() => onNavigate("chat")}>
              Entrar al chat
            </Button>
          </div>

          {/* WELLNESS TIPS */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-5 shadow-soft relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Sparkles className="h-4 w-4 text-accent" /> Tip del día
              </div>
              <p className="text-white/90 text-sm leading-relaxed">{dailyTip}</p>
            </div>
          </div>

          {/* PLAN MINI */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Tu plan</div>
              <span className="text-[10px] bg-success/15 text-success font-bold px-2 py-0.5 rounded-full">ACTIVO</span>
            </div>
            <div className="font-display font-bold text-primary">Wellness Empresa</div>
            <div className="text-xs text-muted-foreground">Acme Corp · Vence 31 dic 2026</div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Sesiones</span>
                <span className="font-semibold text-primary">6 / 20</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-cta rounded-full" style={{ width: "30%" }} />
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onNavigate("plan")}>
              Ver detalles
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
