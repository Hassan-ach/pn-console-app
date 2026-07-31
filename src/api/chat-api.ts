import { api } from './client';

export interface ChatMessage {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: string;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    lastMessage: string | null;
    lastMessageAt: string | null;
}

export type StreamEvent =
    | { type: 'metadata'; conversationId: string }
    | { type: 'token'; content: string }
    | { type: 'done' }
    | { type: 'error'; message: string };

export type StreamCallbacks = {
    onMetadata?: (conversationId: string) => void;
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: Error) => void;
};

export const chatApi = {
    getConversations(page?: number, limit?: number): Promise<Conversation[]> {
        const params = new URLSearchParams();
        if (page) params.set('page', String(page));
        if (limit) params.set('limit', String(limit));
        const qs = params.toString();
        return api.get<Conversation[]>(
            `/chat/conversations${qs ? `?${qs}` : ''}`,
        );
    },

    createConversation(): Promise<Conversation> {
        return api.post<Conversation>('/chat/conversations');
    },

    deleteConversation(id: string): Promise<void> {
        return api.del(`/chat/conversations/${id}`);
    },

    getMessages(
        conversationId: string,
        page?: number,
        limit?: number,
    ): Promise<ChatMessage[]> {
        const params = new URLSearchParams({ conversationId });
        if (page) params.set('page', String(page));
        if (limit) params.set('limit', String(limit));
        return api.get<ChatMessage[]>(`/chat/messages?${params.toString()}`);
    },

    retractLastMessages(conversationId: string): Promise<void> {
        return api.del(
            `/chat/messages/retract-last?conversationId=${conversationId}`,
        );
    },

    async sendMessageStream(
        message: string,
        conversationId: string | null,
        callbacks: StreamCallbacks,
        signal?: AbortSignal,
    ): Promise<void> {
        try {
            const response = await api.stream(
                '/chat/messages',
                { message, conversationId },
                signal,
            );
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            let finished = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop()!;

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    let parsed: Record<string, unknown>;
                    try {
                        parsed = JSON.parse(line.slice(6)) as Record<
                            string,
                            unknown
                        >;
                    } catch {
                        continue;
                    }
                    if (parsed.type === 'metadata') {
                        callbacks.onMetadata?.(parsed.conversationId as string);
                    } else if (parsed.type === 'token')
                        callbacks.onToken(parsed.content as string);
                    else if (parsed.type === 'done') {
                        finished = true;
                        callbacks.onDone();
                    } else if (parsed.type === 'error') {
                        finished = true;
                        callbacks.onError(new Error(parsed.message as string));
                    }
                }
            }

            if (!finished) callbacks.onDone();
        } catch (error) {
            if ((error as Error).name === 'AbortError') return;
            callbacks.onError(
                error instanceof Error ? error : new Error(String(error)),
            );
        }
    },
};
