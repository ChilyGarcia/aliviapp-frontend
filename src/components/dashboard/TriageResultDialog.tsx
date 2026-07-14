import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TriageResult } from "@/types/triage.types";

const TRIAGE_LEVEL_STYLES: Record<string, string> = {
  URGENT: "bg-destructive/10 text-destructive border-destructive/20",
  PRIORITY: "bg-warning/10 text-warning border-warning/20",
  PREVENTIVE: "bg-primary/10 text-primary border-primary/20",
  STABLE: "bg-success/10 text-success border-success/20",
};

interface TriageResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triage: TriageResult | null;
  title?: string;
  loading?: boolean;
  footer?: ReactNode;
}

export const TriageResultDialog = ({
  open,
  onOpenChange,
  triage,
  title = "Detalle del triage",
  loading = false,
  footer,
}: TriageResultDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg rounded-2xl">
      {loading || !triage ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {loading ? "Cargando triage…" : "No se pudo cargar el triage."}
        </div>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Evaluación del{" "}
              {new Date(triage.created_at).toLocaleDateString("es-CO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-full border",
                  TRIAGE_LEVEL_STYLES[triage.level] ?? "bg-muted text-muted-foreground"
                )}
              >
                {triage.label}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {triage.percentage}% · {triage.score}/{triage.max_score}
              </span>
            </div>
            <div className="rounded-2xl bg-soft border border-border p-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Orientación</p>
              <p className="text-sm text-foreground leading-relaxed">{triage.advice}</p>
            </div>
            <div className="rounded-2xl bg-soft border border-border p-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Recomendación</p>
              <p className="text-sm text-foreground leading-relaxed">{triage.recommendation}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {footer ?? (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </>
      )}
    </DialogContent>
  </Dialog>
);
