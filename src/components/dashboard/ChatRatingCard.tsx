import { useCallback, useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ratingsService } from "@/services/ratings.service";
import type { RatingEligibility } from "@/types/ratings.types";
import { cn } from "@/lib/utils";

interface ChatRatingCardProps {
  professionalId: string;
  professionalName: string;
  /** Se usa para reconsultar elegibilidad cuando llegan mensajes nuevos. */
  messageCount?: number;
}

const dismissKey = (professionalId: string) => `rating-dismissed:${professionalId}`;

export const ChatRatingCard = ({
  professionalId,
  professionalName,
  messageCount = 0,
}: ChatRatingCardProps) => {
  const [eligibility, setEligibility] = useState<RatingEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(dismissKey(professionalId)) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(dismissKey(professionalId)) === "1");
    } catch {
      setDismissed(false);
    }
    setSubmitted(false);
    setScore(0);
    setComment("");
    setDialogOpen(false);
  }, [professionalId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ratingsService.getEligibility(professionalId);
        if (!cancelled) setEligibility(result);
      } catch (err) {
        if (!cancelled) {
          setEligibility(null);
          setError(err instanceof Error ? err.message : "No se pudo verificar la calificación");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [professionalId, messageCount]);

  useEffect(() => {
    if (
      eligibility?.eligible &&
      !eligibility.already_rated &&
      !submitted &&
      !dismissed &&
      !loading &&
      !error
    ) {
      setDialogOpen(true);
    }
  }, [eligibility, submitted, dismissed, loading, error]);

  const handleDismiss = useCallback(() => {
    setDialogOpen(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey(professionalId), "1");
    } catch {
      /* ignore */
    }
  }, [professionalId]);

  const handleSubmit = async () => {
    if (score < 1) {
      toast({ title: "Selecciona una calificación de 1 a 5 estrellas" });
      return;
    }

    setSubmitting(true);
    try {
      await ratingsService.createRating({
        professional_id: professionalId,
        score,
        comment,
      });
      setSubmitted(true);
      setDialogOpen(false);
      try {
        sessionStorage.removeItem(dismissKey(professionalId));
      } catch {
        /* ignore */
      }
      toast({
        title: "Calificación enviada",
        description: `Tu opinión sobre ${professionalName} ya está publicada.`,
      });
    } catch (submitError) {
      toast({
        title: "No se pudo enviar la calificación",
        description: submitError instanceof Error ? submitError.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const alreadyRated = submitted || Boolean(eligibility?.already_rated);
  const canRate = Boolean(eligibility?.eligible && !alreadyRated);
  const required = eligibility?.required_messages ?? 5;
  const patientProgress = eligibility
    ? Math.min(eligibility.patient_messages, required)
    : 0;
  const professionalProgress = eligibility
    ? Math.min(eligibility.professional_messages, required)
    : 0;

  let tooltipLabel = "Calificar profesional";
  if (loading) tooltipLabel = "Verificando calificación…";
  else if (error) tooltipLabel = "Error al verificar. Pulsa para reintentar";
  else if (alreadyRated) tooltipLabel = `Ya calificaste a ${professionalName}`;
  else if (canRate) tooltipLabel = `Calificar a ${professionalName}`;
  else if (eligibility)
    tooltipLabel = `Para calificar: tú ${patientProgress}/${required} · profesional ${professionalProgress}/${required}`;

  const handleTriggerClick = () => {
    if (loading) return;
    if (error) {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await ratingsService.getEligibility(professionalId);
          setEligibility(result);
        } catch (err) {
          setEligibility(null);
          setError(err instanceof Error ? err.message : "No se pudo verificar la calificación");
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    if (alreadyRated) {
      toast({ title: "Ya enviaste tu calificación para este profesional" });
      return;
    }
    if (!canRate) {
      toast({
        title: "Aún no puedes calificar",
        description: `Necesitan al menos ${required} mensajes cada uno (tú ${patientProgress}/${required}, profesional ${professionalProgress}/${required}).`,
      });
      return;
    }
    setDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "relative h-9 w-9 rounded-full shrink-0",
                canRate && "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10",
                alreadyRated && "text-amber-500/70",
                !canRate && !alreadyRated && !error && "text-muted-foreground",
                error && "text-destructive hover:text-destructive"
              )}
              onClick={handleTriggerClick}
              aria-label={tooltipLabel}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star
                  className={cn(
                    "h-4 w-4",
                    (canRate || alreadyRated) && "fill-amber-400 text-amber-400"
                  )}
                />
              )}
              {canRate && dismissed && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-card" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-center">
            {tooltipLabel}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDismiss();
          else setDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>¿Cómo fue tu experiencia con {professionalName}?</DialogTitle>
            <DialogDescription>
              Ya intercambiaron suficientes mensajes. Tu calificación ayuda a otros pacientes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-1 py-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= (hovered || score);
              return (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setHovered(value)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setScore(value)}
                  className="p-1 rounded-md hover:bg-muted/60 transition-colors"
                  aria-label={`${value} estrellas`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos cómo te fue (opcional)"
            rows={3}
            maxLength={500}
            className="bg-card text-sm"
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleDismiss} disabled={submitting}>
              Más tarde
            </Button>
            <Button variant="hero" onClick={handleSubmit} disabled={submitting || score < 1}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                "Enviar calificación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
