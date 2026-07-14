import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import type { Message } from "@/types/chat.types";

const TYPING_INDICATOR_TIMEOUT_MS = 3000;

interface UseChatSocketResult {
    connected: boolean;
    isPeerTyping: boolean;
    sendMessage: (content: string, metadata?: Message["metadata"]) => void;
    sendTyping: () => void;
}

export function useChatSocket(
    conversationId: string | null,
    onMessage: (message: Message) => void
): UseChatSocketResult {
    const socketRef = useRef<WebSocket | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [connected, setConnected] = useState(false);
    const [isPeerTyping, setIsPeerTyping] = useState(false);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
        setIsPeerTyping(false);

        if (!conversationId) {
            setConnected(false);
            return;
        }

        const token = authService.getAccessToken();
        const socket = new WebSocket(`${WS_BASE_URL}/chats/${conversationId}/?token=${token ?? ""}`);
        socketRef.current = socket;

        socket.onopen = () => setConnected(true);
        socket.onclose = () => setConnected(false);
        socket.onerror = () => setConnected(false);
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);
                if (data?.type === "typing") {
                    setIsPeerTyping(true);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(
                        () => setIsPeerTyping(false),
                        TYPING_INDICATOR_TIMEOUT_MS
                    );
                    return;
                }
                if (data?.type === "message" && typeof data.id === "string") {
                    setIsPeerTyping(false);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    onMessageRef.current(data as Message);
                }
            } catch {
                // ignore malformed frames
            }
        };

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            socket.close();
            socketRef.current = null;
        };
    }, [conversationId]);

    const sendMessage = useCallback((content: string, metadata?: Message["metadata"]) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(
                JSON.stringify({
                    type: "message",
                    content,
                    ...(metadata ? { metadata } : {}),
                })
            );
        }
    }, []);

    const sendTyping = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "typing" }));
        }
    }, []);

    return { connected, isPeerTyping, sendMessage, sendTyping };
}
