import { useEffect, useState } from "react";
import { Check, Crown, MessageCircle, Clock, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { chatService } from "@/services/chat.service";
import { plansService } from "@/services/plans.service";
import type { ChatUsage } from "@/types/chat.types";
import type { Plan } from "@/types/plan.types";
import { formatChatDuration } from "@/types/plan.types";

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const PlanPanel = () => {
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingTo, setChangingTo] = useState<string | null>(null);

  const loadUsage = async () => {
    const data = await chatService.getUsage();
    setUsage(data);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [usageData, plansData] = await Promise.all([
          chatService.getUsage(),
          plansService.listPlans(),
        ]);
        if (cancelled) return;
        setUsage(usageData);
        setPlans(plansData);
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "No se pudo cargar tu plan",
            description: errorMessage(error, "Intenta de nuevo más tarde"),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const changePlan = async (planName: string) => {
    setChangingTo(planName);
    try {
      await plansService.changePlan(planName);
      await loadUsage();
      toast({ title: "Plan actualizado", description: `Ahora tienes el plan ${planName}.` });
    } catch (error) {
      toast({
        title: "No se pudo cambiar de plan",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setChangingTo(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando tu plan…</div>;
  }

  const used = usage?.used_this_month ?? 0;
  const total = usage?.monthly_chat_limit ?? 0;
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Plan card */}
      <div className="bg-hero text-primary-foreground rounded-3xl p-8 shadow-elegant relative overflow-hidden">
        <div className="absolute top-4 right-6 text-white/10 text-7xl font-black">×</div>
        <div className="relative">
          <div className="flex items-center gap-2 text-sm bg-white/15 w-fit px-3 py-1.5 rounded-full mb-4">
            <Crown className="h-4 w-4 text-accent" /> Plan activo
          </div>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl">{usage?.plan_name ?? "—"}</h2>
          <p className="text-white/85 mt-2 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Cada chat dura hasta 30 min (FREE) o 24 h (PREMIUM)
          </p>

          <div className="mt-8 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/15">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-xs text-white/70">Chats utilizados este mes</div>
                <div className="font-display font-bold text-2xl">{used} / {total}</div>
              </div>
              <span className="text-sm text-accent font-semibold">{Math.max(total - used, 0)} disponibles</span>
            </div>
            <div className="h-2 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-smooth" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan options */}
      <div>
        <h3 className="font-display font-bold text-primary text-lg mb-4">Cambiar de plan</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isActive = plan.name === usage?.plan_name;
            return (
              <div
                key={plan.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-soft flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-display font-bold text-primary flex items-center gap-2">
                    {plan.name}
                    {isActive && <Check className="h-4 w-4 text-success" />}
                  </div>
                  {isActive && (
                    <span className="text-[10px] bg-success/15 text-success font-bold px-2 py-0.5 rounded-full">ACTIVO</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" /> {plan.monthly_chat_limit} chats / mes
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Cada chat dura {formatChatDuration(plan.chat_duration_minutes)}
                </div>
                <Button
                  variant={isActive ? "outline" : "hero"}
                  size="sm"
                  className="w-full mt-2"
                  disabled={isActive || changingTo !== null}
                  onClick={() => changePlan(plan.name)}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  {changingTo === plan.name ? "Cambiando…" : isActive ? "Plan actual" : "Cambiar a este plan"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
