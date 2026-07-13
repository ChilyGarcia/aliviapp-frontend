import { apiFetch } from "@/lib/api-client";
import type { ChatUsage, Conversation, Message } from "@/types/chat.types";

class ChatService {
    async listConversations(): Promise<Conversation[]> {
        return apiFetch<Conversation[]>("/chats/");
    }

    async startConversation(professionalId: string): Promise<Conversation> {
        return apiFetch<Conversation>("/chats/", {
            method: "POST",
            body: JSON.stringify({ professional_id: professionalId }),
        });
    }

    async listMessages(conversationId: string): Promise<Message[]> {
        return apiFetch<Message[]>(`/chats/${conversationId}/messages/`);
    }

    async sendMessage(conversationId: string, content: string): Promise<Message> {
        return apiFetch<Message>(`/chats/${conversationId}/messages/`, {
            method: "POST",
            body: JSON.stringify({ content }),
        });
    }

    async getUsage(): Promise<ChatUsage> {
        return apiFetch<ChatUsage>("/chats/usage/");
    }
}

export const chatService = new ChatService();
