import { useEffect, useState } from "react";
import { Brain, ArrowRight, Sparkles, RefreshCw, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { triageService } from "@/services/triage.service";
import type { TriageAnswerInput, TriageLevel, TriageQuestion, TriageResult } from "@/types/triage.types";

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const LEVEL_COLOR: Record<TriageLevel, string> = {
  STABLE: "bg-success",
  PREVENTIVE: "bg-warning",
  PRIORITY: "bg-orange-500",
  URGENT: "bg-destructive",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const TriagePanel = () => {
  const [questions, setQuestions] = useState<TriageQuestion[]>([]);
  const [history, setHistory] = useState<TriageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<TriageAnswerInput[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [questionsData, historyData] = await Promise.all([
        triageService.getQuestions(),
        triageService.getHistory(),
      ]);
      setQuestions(questionsData);
      setHistory(historyData);
    } catch (error) {
      setLoadError(true);
      toast({
        title: "No se pudo cargar el triage",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (finalAnswers: TriageAnswerInput[]) => {
    setSubmitting(true);
    try {
      const data = await triageService.submit(finalAnswers);
      setResult(data);
      setHistory((prev) => [data, ...prev]);
    } catch (error) {
      toast({
        title: "No se pudo enviar el triage",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const choose = (optionIndex: number) => {
    const question = questions[step];
    const next = [...answers, { question_id: question.id, option_index: optionIndex }];
    setAnswers(next);
    if (step + 1 >= questions.length) {
      void submit(next);
    } else {
      setStep(step + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto text-sm text-muted-foreground">Cargando triage…</div>;
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 shadow-soft text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">
          No pudimos conectar con el servicio de triage.
        </p>
        <Button variant="outline" onClick={() => void loadData()}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  // RESULT VIEW
  if (result) {
    const color = LEVEL_COLOR[result.level];
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-hero text-primary-foreground rounded-3xl p-8 shadow-elegant relative overflow-hidden">
          <div className="absolute top-6 right-8 text-white/10 text-6xl font-black">×</div>
          <div className="relative">
            <div className="flex items-center gap-2 text-sm bg-white/15 w-fit px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-accent" /> Resultado del Triage IA
            </div>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-2">{result.label}</h2>
            <p className="text-white/85">{result.advice}</p>

            <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/15">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="text-xs text-white/70">Índice de carga emocional</div>
                  <div className="font-display font-bold text-2xl">{Math.round(result.percentage)}%</div>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full text-white", color)}>
                  {result.label}
                </span>
              </div>
              <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                <div className={cn("h-full transition-smooth", color)} style={{ width: `${result.percentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h3 className="font-display font-bold text-primary mb-2">Recomendación</h3>
          <p className="text-sm text-muted-foreground mb-4">{result.recommendation}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="lg">Conectarme con un psicólogo</Button>
            <Button variant="outline" size="lg" onClick={reset}>
              <RefreshCw className="h-4 w-4" /> Hacer triage de nuevo
            </Button>
          </div>
        </div>

        <div className="bg-secondary rounded-2xl p-4 text-xs text-muted-foreground text-center">
          🔒 Esta evaluación es orientativa y confidencial. No reemplaza el diagnóstico de un profesional.
        </div>
      </div>
    );
  }

  // QUESTIONNAIRE VIEW
  const current = questions[step];
  const progress = (step / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-card-grad border border-border rounded-3xl p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-cta flex items-center justify-center shadow-glow">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-primary text-lg">Triage automático IA</div>
            <p className="text-xs text-muted-foreground">
              Evaluación rápida y confidencial · {step + 1} de {questions.length}
            </p>
          </div>
        </div>

        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-8">
          <div className="h-full bg-cta transition-smooth" style={{ width: `${progress}%` }} />
        </div>

        <h3 className="font-display font-bold text-2xl text-primary mb-6 leading-tight">{current.text}</h3>

        <div className="space-y-2">
          {current.options.map((opt) => (
            <button
              key={opt.index}
              disabled={submitting}
              onClick={() => choose(opt.index)}
              className="w-full text-left px-5 py-4 rounded-xl bg-card border border-border hover:border-primary hover:bg-secondary transition-smooth flex items-center justify-between group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="font-medium text-foreground">{opt.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
            </button>
          ))}
        </div>

        {submitting && (
          <p className="text-xs text-muted-foreground mt-4 text-center">Analizando tus respuestas…</p>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-primary" />
            <h3 className="font-display font-bold text-primary">Tus triages anteriores</h3>
          </div>
          <div className="divide-y divide-border">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-foreground text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(item.created_at)}</div>
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full text-white", LEVEL_COLOR[item.level])}>
                  {Math.round(item.percentage)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
