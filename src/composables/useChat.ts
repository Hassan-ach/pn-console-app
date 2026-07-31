import { ref, nextTick, onUnmounted } from 'vue';
import { chatApi, type ChatMessage } from '../api/chat-api';

export function useChat() {
    const messages = ref<ChatMessage[]>([]);
    const isLoading = ref(false);
    const isStreaming = ref(false);
    const error = ref<string | null>(null);
    const input = ref('');
    const lastUserMessage = ref('');
    const isAtBottom = ref(true);
    let abortController: AbortController | null = null;

    onUnmounted(() => {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
    });

    async function loadHistory() {
        isLoading.value = true;
        error.value = null;
        try {
            const fetched = await chatApi.getMessages();
            // Deduplicate by content + role to prevent orphaned duplicates
            const seen = new Set<string>();
            messages.value = fetched.filter((msg) => {
                const key = `${msg.role}:${msg.content}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            isLoading.value = false;
            await nextTick();
            scrollToBottom();
        } catch (err) {
            error.value =
                err instanceof Error ? err.message : 'Failed to load history';
            isLoading.value = false;
        }
    }

    async function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isStreaming.value) return;

        lastUserMessage.value = trimmed;
        error.value = null;
        isStreaming.value = true;

        const userMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: 'USER',
            content: trimmed,
            createdAt: new Date().toISOString(),
        };
        messages.value.push(userMessage);

        const assistantMessage: ChatMessage = {
            id: `temp-stream-${Date.now()}`,
            role: 'ASSISTANT',
            content: '',
            createdAt: new Date().toISOString(),
        };
        messages.value.push(assistantMessage);

        await nextTick();
        scrollToBottom();

        abortController = new AbortController();
        const signal = abortController.signal;

        await chatApi.sendMessageStream(
            trimmed,
            {
                onToken(token: string) {
                    assistantMessage.content += token;
                    if (isAtBottom.value) {
                        void nextTick(() => scrollToBottom());
                    }
                },
                onDone() {
                    isStreaming.value = false;
                    input.value = '';
                    abortController = null;
                },
                onError(err: Error) {
                    error.value = err.message;
                    isStreaming.value = false;
                    input.value = '';
                    abortController = null;
                },
            },
            signal,
        );
    }

    async function retry() {
        if (!lastUserMessage.value) return;
        const msg = lastUserMessage.value;
        messages.value = messages.value.filter(
            (m) => !m.id.startsWith('temp-'),
        );
        try {
            await chatApi.retractLastMessages();
        } catch {
            // Best-effort cleanup of failed messages from DB
        }
        // Reload from server to ensure clean state before re-sending
        try {
            const fetched = await chatApi.getMessages();
            const seen = new Set<string>();
            messages.value = fetched.filter((m) => {
                const key = `${m.role}:${m.content}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        } catch {
            // Keep local state if reload fails
        }
        await sendMessage(msg);
    }

    function scrollToTop() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function handleScroll() {
        const container = document.getElementById('chat-messages');
        if (container) {
            const threshold = 100;
            isAtBottom.value =
                container.scrollHeight -
                    container.scrollTop -
                    container.clientHeight <
                threshold;
        }
    }

    return {
        messages,
        isLoading,
        isStreaming,
        error,
        input,
        isAtBottom,
        loadHistory,
        sendMessage,
        retry,
        scrollToTop,
        scrollToBottom,
        handleScroll,
    };
}
