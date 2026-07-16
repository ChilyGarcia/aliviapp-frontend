import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { clinicalNotesService } from "@/services/clinical-notes.service";
import { CLINICAL_NOTE_CATEGORIES } from "@/types/clinical-notes.types";

interface ChatClinicalNoteButtonProps {
  conversationId: string;
  patientId: string;
  patientName: string;
}

const emptyForm = {
  categories: [] as string[],
  reason: "",
  observations: "",
  therapeuticPlan: "",
  nextSessionAt: "",
};

export const ChatClinicalNoteButton = ({
  conversationId,
  patientName,
}: ChatClinicalNoteButtonProps) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  if (user?.role !== "PROFESSIONAL") return null;

  const toggleCategory = (value: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(value)
        ? prev.categories.filter((c) => c !== value)
        : [...prev.categories, value],
    }));
  };

  const resetAndClose = () => {
    setForm(emptyForm);
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (form.categories.length === 0) {
      toast({ title: "Selecciona al menos una categoría" });
      return;
    }
    if (!form.reason.trim()) {
      toast({ title: "El motivo de consulta es obligatorio" });
      return;
    }

    setSubmitting(true);
    try {
      await clinicalNotesService.create({
        conversation_id: conversationId,
        categories: form.categories,
        reason: form.reason,
        observations: form.observations,
        therapeutic_plan: form.therapeuticPlan,
        next_session_at: form.nextSessionAt
          ? new Date(form.nextSessionAt).toISOString()
          : null,
      });
      toast({
        title: "Nota clínica guardada",
        description: `Se registró la nota para ${patientName}.`,
      });
      resetAndClose();
    } catch (error) {
      toast({
        title: "No se pudo guardar la nota",
        description: error instanceof Error ? error.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
              className="h-9 w-9 rounded-full shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => setDialogOpen(true)}
              aria-label={`Registrar nota clínica de ${patientName}`}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-center">
            Registrar nota clínica
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : resetAndClose())}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva nota clínica · {patientName}</DialogTitle>
            <DialogDescription>
              Una vez guardada, la nota queda como registro permanente y no se puede editar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Categorías</Label>
              <div className="grid grid-cols-2 gap-2">
                {CLINICAL_NOTE_CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={form.categories.includes(category.value)}
                      onCheckedChange={() => toggleCategory(category.value)}
                    />
                    {category.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="reason" className="mb-2 block">
                Motivo de la consulta
              </Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                rows={2}
                maxLength={300}
                className="bg-soft text-sm"
              />
            </div>

            <div>
              <Label htmlFor="observations" className="mb-2 block">
                Observaciones
              </Label>
              <Textarea
                id="observations"
                value={form.observations}
                onChange={(e) => setForm((prev) => ({ ...prev, observations: e.target.value }))}
                rows={3}
                maxLength={3000}
                className="bg-soft text-sm"
              />
            </div>

            <div>
              <Label htmlFor="therapeutic-plan" className="mb-2 block">
                Plan terapéutico
              </Label>
              <Textarea
                id="therapeutic-plan"
                value={form.therapeuticPlan}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, therapeuticPlan: e.target.value }))
                }
                rows={3}
                maxLength={3000}
                className="bg-soft text-sm"
              />
            </div>

            <div>
              <Label htmlFor="next-session" className="mb-2 block">
                Próxima sesión estimada (opcional)
              </Label>
              <Input
                id="next-session"
                type="datetime-local"
                value={form.nextSessionAt}
                onChange={(e) => setForm((prev) => ({ ...prev, nextSessionAt: e.target.value }))}
                className="bg-soft text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={resetAndClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="hero" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
                </>
              ) : (
                "Guardar nota"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
