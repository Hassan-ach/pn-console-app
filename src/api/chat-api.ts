import { api } from './client';

export interface ChatMessage {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: string;
}

export type StreamCallbacks = {
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (error: Error) => void;
};

export const chatApi = {
    getMessages(): Promise<ChatMessage[]> {
        return api.get<ChatMessage[]>('/chat/messages');
    },

    async sendMessageStream(
        message: string,
        callbacks: StreamCallbacks,
    ): Promise<void> {
        try {
            const response = await api.stream('/chat/messages', { message });
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop()!;

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const parsed: Record<string, unknown> = JSON.parse(
                        line.slice(6),
                    ) as Record<string, unknown>;
                    if (parsed.type === 'token')
                        callbacks.onToken(parsed.content as string);
                    else if (parsed.type === 'done') callbacks.onDone();
                    else if (parsed.type === 'error')
                        callbacks.onError(new Error(parsed.message as string));
                }
            }
        } catch (error) {
            callbacks.onError(
                error instanceof Error ? error : new Error(String(error)),
            );
        }
    },
};
