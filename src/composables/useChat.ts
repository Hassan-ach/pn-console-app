import { ref, computed, nextTick, onUnmounted } from 'vue';
import { chatApi, type ChatMessage, type Conversation } from '../api/chat-api';

export function useChat() {
    const messages = ref<ChatMessage[]>([]);
    const conversations = ref<Conversation[]>([]);
    const activeConversationId = ref<string | null>(null);
    const isLoading = ref(false);
    const isStreaming = ref(false);
    const error = ref<string | null>(null);
    const input = ref('');
    const lastUserMessage = ref('');
    const isAtBottom = ref(true);
    const sidebarOpen = ref(true);
    let abortController: AbortController | null = null;

    const activeConversation = computed(
        () =>
            conversations.value.find(
                (c) => c.id === activeConversationId.value,
            ) ?? null,
    );

    onUnmounted(() => {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
    });

    async function loadConversations() {
        try {
            conversations.value = await chatApi.getConversations(1, 100);
            if (!activeConversationId.value && conversations.value.length > 0) {
                await switchConversation(conversations.value[0].id);
            }
            if (conversations.value.length === 0) {
                await startNewChat();
            }
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : 'Failed to load conversations';
        }
    }

    async function loadHistory() {
        if (!activeConversationId.value) return;
        isLoading.value = true;
        error.value = null;
        try {
            const fetched = await chatApi.getMessages(
                activeConversationId.value,
            );
            const seen = new Set<string>();
            messages.value = fetched.filter((msg) => {
                if (seen.has(msg.id)) return false;
                seen.add(msg.id);
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

    async function switchConversation(conversationId: string) {
        if (isStreaming.value) return;
        activeConversationId.value = conversationId;
        await loadHistory();
    }

    async function deleteConversation(conversationId: string) {
        if (isStreaming.value) return;

        try {
            await chatApi.deleteConversation(conversationId);
            conversations.value = conversations.value.filter(
                (c) => c.id !== conversationId,
            );

            if (activeConversationId.value === conversationId) {
                const next =
                    conversations.value.find((c) => c.messageCount > 0) ??
                    conversations.value[0];
                if (next) {
                    await switchConversation(next.id);
                } else {
                    activeConversationId.value = null;
                    messages.value = [];
                }
            }
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : 'Failed to delete conversation';
        }
    }

    async function startNewChat() {
        if (isStreaming.value) return;

        const existingEmpty = conversations.value.find(
            (c) => c.messageCount === 0,
        );
        if (existingEmpty) {
            activeConversationId.value = existingEmpty.id;
            messages.value = [];
            error.value = null;
            await nextTick();
            return;
        }

        try {
            const conv = await chatApi.createConversation();
            conversations.value.unshift(conv);
            activeConversationId.value = conv.id;
            messages.value = [];
            error.value = null;
            await nextTick();
        } catch (err) {
            error.value =
                err instanceof Error
                    ? err.message
                    : 'Failed to create new chat';
        }
    }

    async function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isStreaming.value) return;

        const currentConvId = activeConversationId.value;
        if (!currentConvId) return;

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
            currentConvId,
            {
                onMetadata(conversationId: string) {
                    if (activeConversationId.value !== conversationId) {
                        activeConversationId.value = conversationId;
                        messages.value = messages.value.filter(
                            (m) => !m.id.startsWith('temp-'),
                        );
                    }
                },
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
                    void chatApi.getConversations(1, 100).then((list) => {
                        conversations.value = list;
                    });
                },
                onError(err: Error) {
                    error.value = err.message;
                    isStreaming.value = false;
                    input.value = '';
                    abortController = null;
                    messages.value = messages.value.filter(
                        (m) => !m.id.startsWith('temp-'),
                    );
                },
            },
            signal,
        );
    }

    async function retry() {
        if (!lastUserMessage.value || !activeConversationId.value) return;
        const msg = lastUserMessage.value;
        messages.value = messages.value.filter(
            (m) => !m.id.startsWith('temp-'),
        );
        try {
            await chatApi.retractLastMessages(activeConversationId.value);
        } catch (err) {
            console.warn(
                '[useChat] Retract last messages non-fatal error:',
                err,
            );
        }
        try {
            const fetched = await chatApi.getMessages(
                activeConversationId.value,
            );
            const seen = new Set<string>();
            messages.value = fetched.filter((m) => {
                if (seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
            });
        } catch (err) {
            console.warn('[useChat] Fetch messages non-fatal error:', err);
        }
        await sendMessage(msg);
    }

    function stopGenerating() {
        if (!abortController) return;
        abortController.abort();
        abortController = null;
        isStreaming.value = false;
        input.value = '';
    }

    function toggleSidebar() {
        sidebarOpen.value = !sidebarOpen.value;
    }

    function isFailedResponse(content: string): boolean {
        return (
            content.trim() ===
            'Sorry, an error occurred while processing your request.'
        );
    }

    async function retryFailedMessage(assistantMessageId: string) {
        if (isStreaming.value) return;
        const idx = messages.value.findIndex(
            (m) => m.id === assistantMessageId,
        );
        if (idx === -1) return;
        const failed = messages.value[idx];
        if (failed.role !== 'ASSISTANT' || !isFailedResponse(failed.content)) {
            return;
        }

        let userText = '';
        for (let i = idx - 1; i >= 0; i--) {
            if (messages.value[i].role === 'USER') {
                userText = messages.value[i].content;
                break;
            }
        }
        if (!userText) return;

        if (idx === messages.value.length - 1) {
            lastUserMessage.value = userText;
            await retry();
        } else {
            await sendMessage(userText);
        }
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
        conversations,
        activeConversationId,
        activeConversation,
        isLoading,
        isStreaming,
        error,
        input,
        isAtBottom,
        sidebarOpen,
        loadConversations,
        loadHistory,
        sendMessage,
        stopGenerating,
        retry,
        isFailedResponse,
        retryFailedMessage,
        switchConversation,
        startNewChat,
        deleteConversation,
        toggleSidebar,
        scrollToTop,
        scrollToBottom,
        handleScroll,
    };
}
