import { ref, nextTick } from 'vue';
import { chatApi, type ChatMessage } from '../api/chat-api';

export function useChat() {
    const messages = ref<ChatMessage[]>([]);
    const isLoading = ref(false);
    const isStreaming = ref(false);
    const streamingContent = ref('');
    const error = ref<string | null>(null);
    const input = ref('');
    const lastUserMessage = ref('');

    async function loadHistory() {
        isLoading.value = true;
        error.value = null;
        try {
            messages.value = await chatApi.getMessages();
            await nextTick();
            scrollToBottom();
        } catch (err) {
            error.value =
                err instanceof Error ? err.message : 'Failed to load history';
        } finally {
            isLoading.value = false;
        }
    }

    async function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isStreaming.value) return;

        lastUserMessage.value = trimmed;
        error.value = null;
        isStreaming.value = true;
        streamingContent.value = '';

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

        await chatApi.sendMessageStream(trimmed, {
            onToken(token: string) {
                streamingContent.value += token;
                assistantMessage.content = streamingContent.value;
                nextTick(() => scrollToBottom());
            },
            onDone() {
                assistantMessage.content = streamingContent.value;
                streamingContent.value = '';
                isStreaming.value = false;
                input.value = '';
            },
            onError(err: Error) {
                error.value = err.message;
                isStreaming.value = false;
                streamingContent.value = '';
            },
        });
    }

    async function retry() {
        if (!lastUserMessage.value) return;
        const msg = lastUserMessage.value;
        messages.value = messages.value.filter(
            (m) => !m.id.startsWith('temp-'),
        );
        await sendMessage(msg);
    }

    function scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    return {
        messages,
        isLoading,
        isStreaming,
        streamingContent,
        error,
        input,
        loadHistory,
        sendMessage,
        retry,
    };
}
