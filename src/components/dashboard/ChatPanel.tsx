import { useCallback, useEffect, useRef, useState } from "react";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Plus,
  X,
  ArrowLeft,
  Calendar,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { chatService } from "@/services/chat.service";
import { schedulingService } from "@/services/scheduling.service";
import { usersService } from "@/services/users.service";
import {
  ChatAppointmentReminder,
  hasUpcomingAppointment,
} from "@/components/dashboard/ChatAppointmentReminder";
import { ChatRatingCard } from "@/components/dashboard/ChatRatingCard";
import { ChatMessageBubble } from "@/components/dashboard/ChatMessageBubble";
import { TriageResultDialog } from "@/components/dashboard/TriageResultDialog";
import { triageService } from "@/services/triage.service";
import type { User } from "@/types/auth.types";
import type { ChatUsage, Conversation, Message } from "@/types/chat.types";
import type { Appointment } from "@/types/scheduling.types";
import type { TriageResult } from "@/types/triage.types";

const AVATAR_COLORS = ["bg-cta", "bg-primary", "bg-accent", "bg-primary-deep"];

const avatarColor = (id: string) => {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const initialsOf = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const activityAt = (conversation: Conversation) =>
  new Date(conversation.last_message_at || conversation.started_at).getTime();

const sortByActivity = (list: Conversation[]) =>
  [...list].sort((a, b) => activityAt(b) - activityAt(a));

const normalizeConversation = (conversation: Conversation): Conversation => ({
  ...conversation,
  last_message_at: conversation.last_message_at || conversation.started_at,
  expires_at: conversation.expires_at ?? null,
  period_active: Boolean(conversation.period_active),
  unread_count: conversation.unread_count ?? 0,
});

const isPeriodActive = (conversation: Conversation, now = Date.now()) => {
  if (conversation.status !== "ACTIVE") return false;
  if (conversation.period_active && conversation.expires_at) {
    return new Date(conversation.expires_at).getTime() > now;
  }
  if (!conversation.expires_at) return false;
  return new Date(conversation.expires_at).getTime() > now;
};

const bumpConversation = (
  list: Conversation[],
  conversationId: string,
  patch: Partial<Conversation>
) =>
  sortByActivity(
    list.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, ...patch }
        : conversation
    )
  );

export const ChatPanel = ({
  initialProfessionalId,
  onProfessionalHandled,
  onUnreadChange,
  onRequestPlan,
}: {
  initialProfessionalId?: string | null;
  onProfessionalHandled?: () => void;
  onUnreadChange?: (unreadTotal: number) => void;
  onRequestPlan?: () => void;
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [triageDetail, setTriageDetail] = useState<TriageResult | null>(null);
  const [triageDetailOpen, setTriageDetailOpen] = useState(false);
  const [triageDetailLoading, setTriageDetailLoading] = useState(false);
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  useEffect(() => {
    onUnreadChange?.(conversations.reduce((sum, conversation) => sum + (conversation.unread_count || 0), 0));
  }, [conversations, onUnreadChange]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingConversations(true);
      try {
        const list = sortByActivity((await chatService.listConversations()).map(normalizeConversation));
        if (cancelled) return;
        setConversations(list);

        const uniqueIds = Array.from(new Set(list.map((c) => c.professional_id)));
        const resolved = await Promise.all(uniqueIds.map((id) => usersService.getUserById(id)));
        if (cancelled) return;
        setParticipants((prev) => ({ ...prev, ...Object.fromEntries(resolved.map((u) => [u.id, u])) }));

        const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
        if (list.length > 0 && !isMobileViewport) {
          setActiveId(list[0].id);
        }
      } catch (error) {
        toast({
          title: "No se pudieron cargar tus chats",
          description: errorMessage(error, "Intenta de nuevo más tarde"),
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Refresco de bandeja para detectar mensajes en chats no abiertos.
  useEffect(() => {
    let cancelled = false;

    const refreshInbox = async () => {
      try {
        const list = sortByActivity((await chatService.listConversations()).map(normalizeConversation));
        if (cancelled) return;
        setConversations((prev) => {
          const active = activeIdRef.current;
          return list.map((conversation) =>
            conversation.id === active
              ? { ...conversation, unread_count: 0 }
              : conversation
          );
        });
      } catch {
        // silencioso: el panel ya tiene estado local
      }
    };

    const interval = window.setInterval(() => {
      void refreshInbox();
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const scheduled = await schedulingService.listAppointments("SCHEDULED");
        if (!cancelled) setAppointments(scheduled);
      } catch {
        if (!cancelled) setAppointments([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await chatService.getUsage();
        if (!cancelled) setUsage(data);
      } catch {
        if (!cancelled) setUsage(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const list = await chatService.listMessages(activeId);
        if (cancelled) return;
        setMessages(list);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeId
              ? { ...conversation, unread_count: 0 }
              : conversation
          )
        );
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "No se pudieron cargar los mensajes",
            description: errorMessage(error, "Intenta de nuevo más tarde"),
            variant: "destructive",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const handleIncoming = useCallback((message: Message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    setConversations((prev) =>
      bumpConversation(prev, message.conversation_id, {
        last_message_at: message.sent_at,
        unread_count: 0,
        ...(message.period_expires_at
          ? {
              expires_at: message.period_expires_at,
              period_active: Boolean(message.period_active),
            }
          : {}),
      })
    );
    if (message.period_active) {
      void chatService.getUsage().then(setUsage).catch(() => undefined);
    }
    if (message.sender_id !== user?.id) {
      void chatService.markConversationRead(message.conversation_id).catch(() => undefined);
    }
  }, [user?.id]);

  const openTriageDetail = useCallback(async (assessmentId: string) => {
    setTriageDetailOpen(true);
    setTriageDetailLoading(true);
    setTriageDetail(null);
    try {
      const result = await triageService.getById(assessmentId);
      setTriageDetail(result);
    } catch (error) {
      setTriageDetailOpen(false);
      toast({
        title: "No se pudo cargar el triage",
        description: error instanceof Error ? error.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setTriageDetailLoading(false);
    }
  }, []);

  const { connected, isPeerTyping, sendMessage: wsSend, sendTyping } = useChatSocket(activeId, handleIncoming);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPeerTyping]);
  const lastTypingSentRef = useRef(0);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeParticipant = active ? participants[active.professional_id] : undefined;
  const periodActive = active ? isPeriodActive(active) : false;
  const standby = Boolean(active && active.status === "ACTIVE" && !periodActive);
  const usageLoaded = usage !== null;
  const remainingChats = usage?.remaining ?? 0;
  const quotaExhausted = standby && usageLoaded && remainingChats <= 0;
  const canRenewPeriod = standby && usageLoaded && remainingChats > 0;
  const isStatusClosed = Boolean(active && active.status !== "ACTIVE");
  const canSend = Boolean(
    active && active.status === "ACTIVE" && (periodActive || (usageLoaded && remainingChats > 0))
  );
  const composerBlocked = isStatusClosed || quotaExhausted;

  const handleInputChange = (value: string) => {
    setInput(value);
    const now = Date.now();
    if (connected && canSend && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      sendTyping();
    }
  };

  const send = async () => {
    const content = input.trim();
    if (!content || !activeId || !canSend) return;
    setInput("");

    if (connected) {
      wsSend(content);
      setConversations((prev) =>
        bumpConversation(prev, activeId, {
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
      );
      return;
    }

    try {
      const message = await chatService.sendMessage(activeId, content);
      setMessages((prev) => [...prev, message]);
      setConversations((prev) =>
        bumpConversation(prev, activeId, {
          last_message_at: message.sent_at,
          unread_count: 0,
          ...(message.period_expires_at
            ? {
                expires_at: message.period_expires_at,
                period_active: Boolean(message.period_active),
              }
            : {}),
        })
      );
      if (standby || message.period_active) {
        void chatService.getUsage().then(setUsage).catch(() => undefined);
      }
    } catch (error) {
      const description = errorMessage(error, "Intenta de nuevo");
      const isLimit =
        /limit|mensual|reached/i.test(description) || description.includes("Monthly chat limit");
      toast({
        title: isLimit ? "Sin chats disponibles" : "No se pudo enviar el mensaje",
        description: isLimit
          ? "Ya usaste todos los chats de tu plan este mes. Mejora tu plan para continuar."
          : description,
        variant: "destructive",
      });
      void chatService.getUsage().then(setUsage).catch(() => undefined);
    }
  };

  const openPicker = async () => {
    setShowPicker(true);
    if (professionals.length > 0) return;

    setLoadingProfessionals(true);
    try {
      const list = await usersService.listProfessionals();
      setProfessionals(list);
      setParticipants((prev) => ({ ...prev, ...Object.fromEntries(list.map((u) => [u.id, u])) }));
    } catch (error) {
      toast({
        title: "No se pudo cargar el equipo de profesionales",
        description: errorMessage(error, "Intenta de nuevo más tarde"),
        variant: "destructive",
      });
    } finally {
      setLoadingProfessionals(false);
    }
  };

  const startChat = async (professionalId: string) => {
    setStartingChat(true);
    try {
      const conversation = normalizeConversation(await chatService.startConversation(professionalId));
      setConversations((prev) =>
        sortByActivity(
          prev.some((c) => c.id === conversation.id)
            ? prev.map((c) => (c.id === conversation.id ? conversation : c))
            : [conversation, ...prev]
        )
      );
      setActiveId(conversation.id);
      setShowPicker(false);

      const professional = professionals.find((p) => p.id === professionalId)
        ?? participants[professionalId];
      if (professional) {
        setParticipants((prev) => ({ ...prev, [professional.id]: professional }));
      } else {
        const fetched = await usersService.getUserById(professionalId);
        setParticipants((prev) => ({ ...prev, [fetched.id]: fetched }));
      }

      window.setTimeout(() => inputRef.current?.focus(), 50);
    } catch (error) {
      toast({
        title: "No se pudo iniciar el chat",
        description: errorMessage(error, "Revisa tu plan mensual de chats"),
        variant: "destructive",
      });
    } finally {
      setStartingChat(false);
    }
  };

  const reopenClosedChat = () => {
    if (!active) return;
    void startChat(active.professional_id);
  };

  const continueStandbyChat = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!initialProfessionalId) return;
    void startChat(initialProfessionalId).finally(() => onProfessionalHandled?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProfessionalId]);

  const filtered = conversations.filter((c) => {
    const name = participants[c.professional_id]?.full_name ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id ? { ...conversation, unread_count: 0 } : conversation
      )
    );
    void chatService.markConversationRead(id).catch(() => undefined);
  };
  const handleBackToList = () => setActiveId(null);

  const conversationList = (
    <>
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-primary">Mensajes</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openPicker}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-secondary rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingConversations && (
          <p className="text-xs text-muted-foreground text-center p-4">Cargando chats…</p>
        )}
        {!loadingConversations && filtered.length === 0 && (
          <div className="text-center p-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Aún no tienes conversaciones.
            </p>
            <Button variant="hero" size="sm" onClick={openPicker}>
              <Plus className="h-4 w-4" /> Iniciar chat
            </Button>
          </div>
        )}
        {filtered.map((c) => {
          const participant = participants[c.professional_id];
          const name = participant?.full_name ?? "Profesional";
          const expired = c.status !== "ACTIVE";
          const cStandby = c.status === "ACTIVE" && !isPeriodActive(c);
          const hasAppointment = hasUpcomingAppointment(
            appointments,
            c.professional_id,
            "professional_id"
          );
          const unread = c.unread_count > 0 && c.id !== activeId;
          return (
            <button
              key={c.id}
              onClick={() => handleSelectConversation(c.id)}
              className={cn(
                "w-full text-left px-4 py-3 flex items-center gap-3 border-l-4 transition-smooth",
                activeId === c.id ? "bg-card border-primary" : "border-transparent hover:bg-card",
                unread && "bg-primary/[0.04]"
              )}
            >
              <div className="relative shrink-0">
                <div className={`h-11 w-11 rounded-full ${avatarColor(c.id)} flex items-center justify-center font-bold text-primary-foreground text-sm`}>
                  {initialsOf(name)}
                </div>
                {!expired && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-card" />}
                {hasAppointment && (
                  <span className="absolute -top-0.5 -left-0.5 h-3.5 w-3.5 rounded-full bg-cta ring-2 ring-card flex items-center justify-center">
                    <Calendar className="h-2 w-2 text-primary-foreground" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <div className={cn("text-sm truncate", unread ? "font-bold text-foreground" : "font-semibold text-foreground")}>
                    {name}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn("text-[10px]", unread ? "text-primary font-semibold" : "text-muted-foreground")}>
                      {formatTime(c.last_message_at || c.started_at)}
                    </span>
                    {unread && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-cta text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {c.unread_count > 99 ? "99+" : c.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                <p className={cn("text-xs truncate", unread ? "text-foreground/80 font-medium" : "text-muted-foreground")}>
                  {expired ? "Chat cerrado" : cStandby ? "En espera · envía un mensaje para continuar" : unread ? "Nuevos mensajes del profesional" : "Chat activo"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className={cn(
      "bg-card rounded-3xl shadow-soft border border-border flex overflow-hidden",
      isMobile ? "h-[calc(100dvh-9rem)]" : "h-[calc(100vh-10rem)]"
    )}>
      {/* CONVERSATION LIST */}
      <div className={cn(
        "border-r border-border flex flex-col bg-soft shrink-0",
        isMobile
          ? activeId ? "hidden" : "flex w-full"
          : "hidden md:flex w-72"
      )}>
        {conversationList}
      </div>

      {/* MAIN PANE */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isMobile && !activeId ? "hidden" : "flex"
      )}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
            {loadingConversations
              ? "Cargando…"
              : "Selecciona un chat o inicia uno nuevo con el botón +."}
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={handleBackToList}
                  aria-label="Volver a mensajes"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative shrink-0">
                  <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full ${avatarColor(active.id)} flex items-center justify-center font-bold text-primary-foreground text-sm`}>
                    {initialsOf(activeParticipant?.full_name ?? "P")}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-primary truncate text-sm sm:text-base">
                    {activeParticipant?.full_name ?? "Profesional"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {isStatusClosed
                      ? "Chat cerrado"
                      : quotaExhausted
                        ? "Sin chats disponibles este mes"
                        : standby && !usageLoaded
                          ? "Comprobando disponibilidad…"
                          : canRenewPeriod
                            ? "Periodo finalizado · ábrelo de nuevo para continuar"
                        : standby
                          ? "Periodo en espera · el próximo mensaje usa 1 chat del mes"
                        : isPeerTyping
                          ? "Escribiendo…"
                          : connected
                            ? "En línea · conectado"
                            : "Conectando…"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {activeParticipant && (
                  <ChatAppointmentReminder
                    appointments={appointments}
                    participantId={active.professional_id}
                    participantName={activeParticipant.full_name}
                    matchField="professional_id"
                  />
                )}
                {activeParticipant && (
                  <ChatRatingCard
                    professionalId={active.professional_id}
                    professionalName={activeParticipant.full_name}
                    messageCount={messages.length}
                  />
                )}
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex" disabled><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex" disabled><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-soft">
              {messages.map((m) => (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  isOwn={m.sender_id === user?.id}
                  onOpenTriage={openTriageDetail}
                />
              ))}
              {isPeerTyping && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 sm:p-4 border-t border-border bg-card">
              {isStatusClosed && (
                <div className="mb-3 rounded-2xl border border-border bg-soft px-4 py-3 text-center space-y-2">
                  <p className="text-sm text-foreground font-medium">
                    Este chat ya finalizó
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Puedes abrir una nueva conversación con{" "}
                    {activeParticipant?.full_name ?? "este profesional"}.
                  </p>
                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={startingChat}
                    onClick={reopenClosedChat}
                  >
                    {startingChat ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Abriendo…
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        Abrir de nuevo el chat
                      </>
                    )}
                  </Button>
                </div>
              )}

              {quotaExhausted && (
                <div className="mb-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center space-y-2">
                  <p className="text-sm text-foreground font-medium">
                    Sin chats disponibles este mes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ya usaste los {usage?.monthly_chat_limit ?? ""} chats de tu plan
                    {usage?.plan_name ? ` (${usage.plan_name})` : ""}. Mejora tu plan para continuar.
                  </p>
                  {onRequestPlan && (
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onRequestPlan}>
                      Ver mi plan
                    </Button>
                  )}
                </div>
              )}

              {canRenewPeriod && (
                <div className="mb-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center space-y-2">
                  <p className="text-sm text-foreground font-medium">
                    Este chat ya finalizó
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ábrelo de nuevo con {activeParticipant?.full_name ?? "este profesional"}{" "}
                    (usa 1 chat de tu plan este mes).
                  </p>
                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={continueStandbyChat}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Abrir de nuevo el chat
                  </Button>
                </div>
              )}

              {!composerBlocked && (
                <div className="flex items-center gap-2 bg-secondary rounded-2xl px-3 py-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    disabled={!canSend && !canRenewPeriod}
                    placeholder={
                      canRenewPeriod
                        ? "Escribe para abrir de nuevo el chat…"
                        : "Escribe un mensaje…"
                    }
                    className="flex-1 bg-transparent outline-none text-sm py-2 disabled:opacity-50 min-w-0"
                  />
                  <Button variant="hero" size="icon" onClick={send} disabled={!canSend} className="rounded-xl shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2 text-center">🔒 Conversación confidencial</p>
            </div>
          </>
        )}
      </div>

      {/* NEW CHAT PICKER */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
          <div
            className="bg-card rounded-3xl shadow-elegant border border-border max-w-md w-full max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h4 className="font-display font-bold text-primary">Nuevo chat</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowPicker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {loadingProfessionals && <p className="text-xs text-muted-foreground text-center p-4">Cargando…</p>}
              {!loadingProfessionals && professionals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center p-4">No hay profesionales disponibles.</p>
              )}
              {professionals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => startChat(p.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-2xl hover:bg-soft transition-smooth"
                >
                  <div className={`h-10 w-10 rounded-full ${avatarColor(p.id)} flex items-center justify-center font-bold text-primary-foreground text-sm shrink-0`}>
                    {initialsOf(p.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{p.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <TriageResultDialog
        open={triageDetailOpen}
        onOpenChange={setTriageDetailOpen}
        triage={triageDetail}
        loading={triageDetailLoading}
        title="Detalle de tu triage"
      />
    </div>
  );
};
