import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Phone, Video, MoreVertical, Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { chatService } from "@/services/chat.service";
import { usersService } from "@/services/users.service";
import type { User } from "@/types/auth.types";
import type { Conversation, Message } from "@/types/chat.types";

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

export const ChatPanel = () => {
  const { user } = useAuth();
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingConversations(true);
      try {
        const list = await chatService.listConversations();
        if (cancelled) return;
        setConversations(list);

        const uniqueIds = Array.from(new Set(list.map((c) => c.professional_id)));
        const resolved = await Promise.all(uniqueIds.map((id) => usersService.getUserById(id)));
        if (cancelled) return;
        setParticipants((prev) => ({ ...prev, ...Object.fromEntries(resolved.map((u) => [u.id, u])) }));

        if (list.length > 0) setActiveId(list[0].id);
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

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const list = await chatService.listMessages(activeId);
        if (!cancelled) setMessages(list);
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
  }, []);

  const { connected, isPeerTyping, sendMessage: wsSend, sendTyping } = useChatSocket(activeId, handleIncoming);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPeerTyping]);
  const lastTypingSentRef = useRef(0);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activeParticipant = active ? participants[active.professional_id] : undefined;
  const isClosed = active ? active.status !== "ACTIVE" || new Date(active.expires_at) <= new Date() : false;

  const handleInputChange = (value: string) => {
    setInput(value);
    const now = Date.now();
    if (connected && !isClosed && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      sendTyping();
    }
  };

  const send = async () => {
    const content = input.trim();
    if (!content || !activeId || isClosed) return;
    setInput("");

    if (connected) {
      wsSend(content);
      return;
    }

    try {
      const message = await chatService.sendMessage(activeId, content);
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      toast({
        title: "No se pudo enviar el mensaje",
        description: errorMessage(error, "Intenta de nuevo"),
        variant: "destructive",
      });
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
    try {
      const conversation = await chatService.startConversation(professionalId);
      setConversations((prev) =>
        prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]
      );
      setActiveId(conversation.id);
      setShowPicker(false);
    } catch (error) {
      toast({
        title: "No se pudo iniciar el chat",
        description: errorMessage(error, "Revisa tu plan mensual de chats"),
        variant: "destructive",
      });
    }
  };

  const filtered = conversations.filter((c) => {
    const name = participants[c.professional_id]?.full_name ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="bg-card rounded-3xl shadow-soft border border-border h-[calc(100vh-10rem)] flex overflow-hidden">
      {/* CONVERSATION LIST */}
      <div className="w-72 border-r border-border flex flex-col bg-soft shrink-0 hidden md:flex">
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
            <p className="text-xs text-muted-foreground text-center p-4">
              Aún no tienes conversaciones. Toca + para iniciar una.
            </p>
          )}
          {filtered.map((c) => {
            const participant = participants[c.professional_id];
            const name = participant?.full_name ?? "Profesional";
            const expired = c.status !== "ACTIVE" || new Date(c.expires_at) <= new Date();
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center gap-3 border-l-4 transition-smooth",
                  activeId === c.id ? "bg-card border-primary" : "border-transparent hover:bg-card"
                )}
              >
                <div className="relative shrink-0">
                  <div className={`h-11 w-11 rounded-full ${avatarColor(c.id)} flex items-center justify-center font-bold text-primary-foreground text-sm`}>
                    {initialsOf(name)}
                  </div>
                  {!expired && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-1">
                    <div className="font-semibold text-sm text-foreground truncate">{name}</div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(c.started_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {expired ? "Chat finalizado" : "Chat activo"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN PANE */}
      <div className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
            {loadingConversations
              ? "Cargando…"
              : "Selecciona un chat o inicia uno nuevo con el botón + de la lista."}
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`h-11 w-11 rounded-full ${avatarColor(active.id)} flex items-center justify-center font-bold text-primary-foreground`}>
                    {initialsOf(activeParticipant?.full_name ?? "P")}
                  </div>
                </div>
                <div>
                  <div className="font-display font-bold text-primary">{activeParticipant?.full_name ?? "Profesional"}</div>
                  <div className="text-xs text-muted-foreground">
                    {isClosed
                      ? "Chat finalizado"
                      : isPeerTyping
                        ? "Escribiendo…"
                        : connected
                          ? "En línea · conectado"
                          : "Conectando…"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" disabled><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-soft">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-soft",
                    m.sender_id === user?.id
                      ? "bg-cta text-primary-foreground rounded-tr-sm"
                      : "bg-card text-foreground rounded-tl-sm border border-border"
                  )}>
                    <p className="leading-relaxed">{m.content}</p>
                    <div className={cn("text-[10px] mt-1", m.sender_id === user?.id ? "text-white/70" : "text-muted-foreground")}>
                      {formatTime(m.sent_at)}
                    </div>
                  </div>
                </div>
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
            <div className="p-4 border-t border-border bg-card">
              {isClosed && (
                <p className="text-xs text-destructive text-center mb-2">
                  Este chat ya finalizó. Inicia uno nuevo con este profesional si lo necesitas.
                </p>
              )}
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  disabled={isClosed}
                  placeholder="Escribe un mensaje seguro y confidencial…"
                  className="flex-1 bg-transparent outline-none text-sm py-2 disabled:opacity-50"
                />
                <Button variant="hero" size="icon" onClick={send} disabled={isClosed} className="rounded-xl shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
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
    </div>
  );
};
