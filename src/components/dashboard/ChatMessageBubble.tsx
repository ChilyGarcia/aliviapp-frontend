import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat.types";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

interface ChatMessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onOpenTriage?: (assessmentId: string) => void;
}

export const ChatMessageBubble = ({
  message,
  isOwn,
  onOpenTriage,
}: ChatMessageBubbleProps) => {
  const isTriageReply = message.metadata?.context === "triage_reply";
  const triageLabel = message.metadata?.triage_label;
  const triageId = message.metadata?.triage_assessment_id;
  const canOpenTriage = Boolean(isTriageReply && triageId && onOpenTriage);

  const bannerText = isOwn
    ? `Respondiendo sobre el triage${triageLabel ? `: ${triageLabel}` : ""}`
    : `Respuesta sobre tu triage${triageLabel ? `: ${triageLabel}` : ""}`;

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] sm:max-w-[75%] flex flex-col", isOwn ? "items-end" : "items-start")}>
        {isTriageReply &&
          (canOpenTriage ? (
            <button
              type="button"
              onClick={() => onOpenTriage?.(triageId!)}
              className="mb-1 px-2.5 py-1 rounded-lg text-[10px] font-medium max-w-full bg-primary/10 text-primary border border-primary/15 hover:bg-primary/15 underline-offset-2 hover:underline text-left transition-colors"
              title="Ver detalle del triage"
            >
              {bannerText} · Ver detalle
            </button>
          ) : (
            <div className="mb-1 px-2.5 py-1 rounded-lg text-[10px] font-medium max-w-full bg-primary/10 text-primary border border-primary/15">
              {bannerText}
            </div>
          ))}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-soft w-fit max-w-full",
            isOwn
              ? "bg-cta text-primary-foreground rounded-tr-sm"
              : "bg-card text-foreground rounded-tl-sm border border-border"
          )}
        >
          <p className="leading-relaxed break-words">{message.content}</p>
          <div
            className={cn(
              "text-[10px] mt-1",
              isOwn ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {formatTime(message.sent_at)}
          </div>
        </div>
      </div>
    </div>
  );
};
