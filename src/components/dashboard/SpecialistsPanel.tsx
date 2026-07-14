import { useEffect, useState } from "react";
import { MessageCircle, Award, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usersService } from "@/services/users.service";
import { getUserInitials } from "@/utils/user.utils";
import type { User } from "@/types/auth.types";
import type { TabKey } from "@/types/dashboard.types";

const AVATAR_COLORS = ["bg-cta", "bg-primary", "bg-accent", "bg-primary-deep"];

const avatarColor = (id: string) => {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const formatMemberSince = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { month: "long", year: "numeric" });

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface SpecialistsPanelProps {
  onNavigate: (key: TabKey) => void;
  onStartChat: (professionalId: string) => void;
}

export const SpecialistsPanel = ({ onNavigate, onStartChat }: SpecialistsPanelProps) => {
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadProfessionals = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const list = await usersService.listProfessionals();
      setProfessionals(list.filter((p) => p.is_active));
    } catch (error) {
      setLoadError(true);
      toast({
        title: "No se pudieron cargar los profesionales",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfessionals();
  }, []);

  const handleStartChat = (professionalId: string) => {
    onStartChat(professionalId);
    onNavigate("chat");
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando profesionales…</div>;
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 shadow-soft text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">No pudimos conectar con el listado de profesionales.</p>
        <Button variant="outline" onClick={() => void loadProfessionals()}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-card-grad rounded-2xl border border-border p-5 shadow-soft mb-6">
        <div className="font-display font-bold text-primary text-lg">Equipo de profesionales</div>
        <p className="text-sm text-muted-foreground">
          {professionals.length > 0
            ? `${professionals.length} psicólogo${professionals.length !== 1 ? "s" : ""} certificado${professionals.length !== 1 ? "s" : ""} disponible${professionals.length !== 1 ? "s" : ""} para ti.`
            : "Aún no hay profesionales registrados en la plataforma."}
        </p>
      </div>

      {professionals.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-soft">
          <p className="text-sm text-muted-foreground">
            Cuando se registren profesionales, aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="bg-card rounded-2xl border border-border p-5 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0",
                    avatarColor(professional.id)
                  )}
                >
                  {getUserInitials(professional.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-primary truncate">{professional.full_name}</h4>
                    <span className="h-2 w-2 rounded-full bg-success shrink-0" title="Disponible" />
                  </div>
                  <p className="text-xs text-muted-foreground">Psicólogo/a · Salud mental</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" /> Certificado
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Desde {formatMemberSince(professional.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="text-[11px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                  Atención por chat
                </span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-success/15 text-success font-medium">
                  Disponible
                </span>
              </div>

              <Button
                variant="hero"
                size="sm"
                className="w-full mt-4"
                onClick={() => handleStartChat(professional.id)}
              >
                <MessageCircle className="h-4 w-4" />
                Iniciar chat
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
