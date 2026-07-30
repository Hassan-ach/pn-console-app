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
    getMessages(page?: number, limit?: number): Promise<ChatMessage[]> {
        const params = new URLSearchParams();
        if (page) params.set('page', String(page));
        if (limit) params.set('limit', String(limit));
        const qs = params.toString();
        return api.get<ChatMessage[]>(`/chat/messages${qs ? `?${qs}` : ''}`);
    },

    retractLastMessages(): Promise<void> {
        return api.del('/chat/messages/retract-last');
    },

    async sendMessageStream(
        message: string,
        callbacks: StreamCallbacks,
        signal?: AbortSignal,
    ): Promise<void> {
        try {
            const response = await api.stream(
                '/chat/messages',
                { message },
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
                    if (parsed.type === 'token')
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
