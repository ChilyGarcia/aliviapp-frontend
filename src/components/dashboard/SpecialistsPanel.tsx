import { Star, MessageCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const specialists = [
  { name: "Dra. Camila Rojas", role: "Psicología clínica", exp: "8 años", rating: 4.9, online: true, tags: ["Ansiedad", "Estrés laboral"], color: "bg-cta" },
  { name: "Dr. Andrés Patiño", role: "Psicología organizacional", exp: "12 años", rating: 4.8, online: true, tags: ["Burnout", "Liderazgo"], color: "bg-primary" },
  { name: "Dra. Valeria Suárez", role: "Terapia cognitivo-conductual", exp: "6 años", rating: 5.0, online: false, tags: ["Depresión", "Autoestima"], color: "bg-accent" },
  { name: "Dr. Mateo Herrera", role: "Psicología familiar", exp: "10 años", rating: 4.7, online: true, tags: ["Pareja", "Familia"], color: "bg-primary-deep" },
  { name: "Dra. Lucía Mendoza", role: "Mindfulness y bienestar", exp: "5 años", rating: 4.9, online: false, tags: ["Mindfulness", "Sueño"], color: "bg-cta" },
  { name: "Dr. Sebastián Cruz", role: "Psicología del deporte", exp: "7 años", rating: 4.8, online: true, tags: ["Motivación", "Hábitos"], color: "bg-primary" },
];

export const SpecialistsPanel = () => {
  return (
    <div>
      <div className="bg-card-grad rounded-2xl border border-border p-5 shadow-soft mb-6">
        <div className="font-display font-bold text-primary text-lg">Equipo de profesionales</div>
        <p className="text-sm text-muted-foreground">Psicólogos certificados disponibles para ti, sin costo adicional.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {specialists.map((s) => (
          <div key={s.name} className="bg-card rounded-2xl border border-border p-5 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth">
            <div className="flex items-start gap-3">
              <div className={`h-14 w-14 rounded-2xl ${s.color} flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0`}>
                {s.name.split(" ").slice(-2).map((p) => p[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-primary truncate">{s.name}</h4>
                  {s.online && <span className="h-2 w-2 rounded-full bg-success" />}
                </div>
                <p className="text-xs text-muted-foreground">{s.role}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {s.rating}</span>
                  <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {s.exp}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {s.tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">{t}</span>
              ))}
            </div>

            <Button variant="hero" size="sm" className="w-full mt-4" disabled={!s.online}>
              <MessageCircle className="h-4 w-4" />
              {s.online ? "Iniciar chat" : "No disponible"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
