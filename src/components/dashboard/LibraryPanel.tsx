import { useState } from "react";
import { Search, BookOpen, Headphones, Video, Activity, Bookmark, Clock, Play, Star, Filter, Sparkles, ArrowRight, Heart, Brain, Moon, Briefcase, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResourceType = "article" | "audio" | "video" | "exercise";
type Category = "all" | "stress" | "anxiety" | "sleep" | "work" | "relationships" | "mindfulness";

interface Resource {
  id: number;
  title: string;
  description: string;
  type: ResourceType;
  category: Exclude<Category, "all">;
  duration: string;
  author: string;
  level: "Básico" | "Intermedio" | "Avanzado";
  rating: number;
  saved?: boolean;
  featured?: boolean;
}

const typeMeta: Record<ResourceType, { label: string; icon: typeof BookOpen; color: string; bg: string }> = {
  article: { label: "Artículo", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
  audio: { label: "Audio", icon: Headphones, color: "text-accent", bg: "bg-accent/10" },
  video: { label: "Video", icon: Video, color: "text-destructive", bg: "bg-destructive/10" },
  exercise: { label: "Ejercicio", icon: Activity, color: "text-success", bg: "bg-success/10" },
};

const categoryMeta: Record<Exclude<Category, "all">, { label: string; icon: typeof Heart }> = {
  stress: { label: "Estrés", icon: Zap },
  anxiety: { label: "Ansiedad", icon: Brain },
  sleep: { label: "Sueño", icon: Moon },
  work: { label: "Trabajo", icon: Briefcase },
  relationships: { label: "Relaciones", icon: Users },
  mindfulness: { label: "Mindfulness", icon: Heart },
};

const categories: { key: Category; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "stress", label: "Estrés" },
  { key: "anxiety", label: "Ansiedad" },
  { key: "sleep", label: "Sueño" },
  { key: "work", label: "Trabajo" },
  { key: "relationships", label: "Relaciones" },
  { key: "mindfulness", label: "Mindfulness" },
];

const types: { key: ResourceType | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "article", label: "Artículos" },
  { key: "audio", label: "Audios" },
  { key: "video", label: "Videos" },
  { key: "exercise", label: "Ejercicios" },
];

const resources: Resource[] = [
  { id: 1, title: "Respiración 4-7-8 para calmar la ansiedad", description: "Técnica guiada de respiración consciente para activar el sistema nervioso parasimpático.", type: "audio", category: "anxiety", duration: "8 min", author: "Dra. Camila Rojas", level: "Básico", rating: 4.9, featured: true, saved: true },
  { id: 2, title: "Cómo gestionar la sobrecarga laboral", description: "Estrategias prácticas para recuperar el equilibrio y prevenir el burnout en el trabajo.", type: "article", category: "work", duration: "6 min lectura", author: "Dr. Andrés Patiño", level: "Intermedio", rating: 4.8, featured: true },
  { id: 3, title: "Higiene del sueño: rutina nocturna ideal", description: "Pasos para mejorar la calidad de tu descanso desde esta misma noche.", type: "video", category: "sleep", duration: "12 min", author: "Dra. Lucía Mendoza", level: "Básico", rating: 4.7, featured: true },
  { id: 4, title: "Diario emocional guiado", description: "Plantilla interactiva para registrar emociones y detectar patrones.", type: "exercise", category: "mindfulness", duration: "10 min", author: "Equipo AliviApp", level: "Básico", rating: 4.6 },
  { id: 5, title: "Comunicación asertiva con tu equipo", description: "Frases y técnicas para expresar lo que sientes sin generar conflicto.", type: "article", category: "relationships", duration: "5 min lectura", author: "Dra. Valeria Suárez", level: "Intermedio", rating: 4.8, saved: true },
  { id: 6, title: "Meditación body scan", description: "Recorrido corporal de 15 minutos para liberar tensión acumulada.", type: "audio", category: "mindfulness", duration: "15 min", author: "Dra. Camila Rojas", level: "Básico", rating: 4.9 },
  { id: 7, title: "Cuando la ansiedad aparece en reuniones", description: "Guía paso a paso para gestionar la activación en contextos laborales.", type: "video", category: "anxiety", duration: "9 min", author: "Dr. Andrés Patiño", level: "Intermedio", rating: 4.7 },
  { id: 8, title: "Pausa activa de 3 minutos", description: "Ejercicios físicos cortos para hacer en tu escritorio y reactivar la energía.", type: "exercise", category: "work", duration: "3 min", author: "Equipo AliviApp", level: "Básico", rating: 4.5 },
  { id: 9, title: "Manejo de pensamientos rumiantes", description: "Técnica cognitiva para detener bucles mentales que generan malestar.", type: "article", category: "anxiety", duration: "7 min lectura", author: "Dra. Valeria Suárez", level: "Avanzado", rating: 4.9 },
];

const playlists = [
  { title: "Empieza tu mañana con calma", count: 5, color: "from-primary to-primary-deep", icon: Sparkles },
  { title: "Desconéctate del trabajo", count: 7, color: "from-accent to-cta", icon: Briefcase },
  { title: "Duerme mejor en 7 días", count: 7, color: "from-primary-deep to-accent", icon: Moon },
];

export const LibraryPanel = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [activeType, setActiveType] = useState<ResourceType | "all">("all");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set(resources.filter(r => r.saved).map(r => r.id)));

  const toggleSave = (id: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = resources.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || r.category === activeCategory;
    const matchType = activeType === "all" || r.type === activeType;
    return matchSearch && matchCat && matchType;
  });

  const featured = resources.filter((r) => r.featured);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* HEADER + SEARCH */}
      <div className="bg-hero text-primary-foreground rounded-3xl p-6 lg:p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm bg-white/15 w-fit px-3 py-1.5 rounded-full mb-3">
            <BookOpen className="h-4 w-4 text-accent" /> Biblioteca de bienestar
          </div>
          <h2 className="font-display font-extrabold text-2xl lg:text-3xl">
            Recursos para cuidar tu mente
          </h2>
          <p className="text-white/85 mt-2 max-w-xl">
            Artículos, audios, videos y ejercicios diseñados por nuestros profesionales.
          </p>
          <div className="mt-5 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar recursos, ej: respiración, sueño…"
              className="w-full bg-white text-foreground rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none shadow-soft"
            />
          </div>
        </div>
      </div>

      {/* PLAYLISTS */}
      <div>
        <h3 className="font-display font-bold text-primary text-lg mb-4">Rutas recomendadas</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((p) => (
            <button key={p.title} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${p.color} text-primary-foreground p-5 text-left shadow-soft hover:shadow-elegant transition-smooth hover:-translate-y-1`}>
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="font-display font-bold">{p.title}</div>
                <div className="text-xs text-white/80 mt-1">{p.count} recursos · ruta guiada</div>
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold">
                  Empezar ruta <ArrowRight className="h-3 w-3 transition-smooth group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FEATURED */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-primary text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> Destacados para ti
          </h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {featured.map((r) => {
            const t = typeMeta[r.type];
            const c = categoryMeta[r.category];
            return (
              <div key={r.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-smooth hover:-translate-y-1">
                <div className={cn("h-32 relative flex items-center justify-center", t.bg)}>
                  <t.icon className={cn("h-12 w-12", t.color)} />
                  <button
                    onClick={() => toggleSave(r.id)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/90 flex items-center justify-center shadow-soft hover:scale-110 transition-smooth"
                  >
                    <Bookmark className={cn("h-4 w-4", savedIds.has(r.id) ? "fill-cta text-cta" : "text-muted-foreground")} />
                  </button>
                  <span className={cn("absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full bg-card", t.color)}>
                    {t.label.toUpperCase()}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase">
                    <c.icon className="h-3 w-3" /> {c.label} · {r.level}
                  </div>
                  <h4 className="font-display font-bold text-primary mt-2 line-clamp-2">{r.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.duration}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" /> {r.rating}</span>
                    </div>
                    <Button variant="hero" size="sm" className="rounded-xl">
                      <Play className="h-3 w-3" /> Abrir
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Filter className="h-4 w-4" /> Filtrar biblioteca
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Categoría</div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-smooth",
                  activeCategory === c.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-soft text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tipo</div>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveType(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-smooth",
                  activeType === t.key
                    ? "bg-cta text-primary-foreground border-cta"
                    : "bg-soft text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS LIST */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-primary text-lg">
            {filtered.length} recurso{filtered.length !== 1 ? "s" : ""}
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-soft">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No encontramos recursos con esos filtros.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const t = typeMeta[r.type];
              const c = categoryMeta[r.category];
              return (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-soft hover:shadow-elegant transition-smooth">
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", t.bg)}>
                    <t.icon className={cn("h-6 w-6", t.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", t.bg, t.color)}>{t.label.toUpperCase()}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <c.icon className="h-3 w-3" /> {c.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">· {r.level}</span>
                    </div>
                    <h4 className="font-semibold text-foreground mt-1 truncate">{r.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.duration}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" /> {r.rating}</span>
                      <span className="hidden sm:inline">· {r.author}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => toggleSave(r.id)}>
                      <Bookmark className={cn("h-4 w-4", savedIds.has(r.id) ? "fill-cta text-cta" : "text-muted-foreground")} />
                    </Button>
                    <Button variant="hero" size="sm" className="rounded-xl">
                      <Play className="h-3 w-3" /> Abrir
                    </Button>
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
