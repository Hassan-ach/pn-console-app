<script setup lang="ts">
import { onMounted } from 'vue';
import { marked } from 'marked';
import { useChat } from '../composables/useChat';

const {
    messages,
    isLoading,
    isStreaming,
    error,
    input,
    loadHistory,
    sendMessage,
    retry,
} = useChat();

marked.setOptions({
    breaks: true,
    gfm: true,
});

function renderMarkdown(content: string): string {
    return marked.parse(content) as string;
}

function handleSend() {
    if (!input.value.trim() || isStreaming.value) return;
    sendMessage(input.value);
}

function sendQuickAction(prompt: string) {
    sendMessage(prompt);
}

onMounted(() => {
    loadHistory();
});
</script>

<template>
    <div class="flex flex-col h-[calc(100vh-72px)] -m-8 bg-[#FCFAF8]">
        <!-- Header -->
        <header
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0"
        >
            <div class="flex items-center gap-3">
                <span
                    class="px-2 py-0.5 bg-[#FF4E1A]/10 text-[#FF4E1A] text-xs font-semibold rounded"
                    >ASK</span
                >
            </div>
            <button
                type="button"
                class="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
                History
            </button>
        </header>

        <!-- Messages area -->
        <div id="chat-messages" class="flex-1 overflow-y-auto px-6 py-4">
            <!-- Loading state -->
            <div
                v-if="isLoading"
                class="flex items-center justify-center h-full"
            >
                <div
                    class="w-6 h-6 border-2 border-[#FF4E1A] border-t-transparent rounded-full animate-spin"
                ></div>
            </div>

            <!-- Empty state -->
            <div
                v-else-if="messages.length === 0 && !isStreaming"
                class="flex items-center justify-center h-full"
            >
                <p class="text-gray-400 text-lg italic">
                    Ask me anything about your insights and messages.
                </p>
            </div>

            <!-- Message list -->
            <div v-else class="max-w-3xl mx-auto space-y-6">
                <div
                    v-for="msg in messages"
                    :key="msg.id"
                    :class="
                        msg.role === 'USER'
                            ? 'flex justify-end'
                            : 'flex justify-start'
                    "
                >
                    <!-- User bubble -->
                    <div
                        v-if="msg.role === 'USER'"
                        class="bg-[#FF4E1A] text-white px-4 py-3 max-w-[70%] text-sm leading-relaxed"
                        style="border-radius: 14px 14px 4px 14px"
                    >
                        {{ msg.content }}
                    </div>

                    <!-- AI card -->
                    <div
                        v-else
                        class="bg-white border border-gray-200 rounded-xl px-5 py-4 max-w-[75%] shadow-sm"
                    >
                        <div
                            v-if="msg.content"
                            class="text-sm text-gray-700 leading-relaxed chat-ai-content"
                            v-html="renderMarkdown(msg.content)"
                        ></div>
                        <div
                            v-else-if="
                                isStreaming &&
                                msg === messages[messages.length - 1]
                            "
                        >
                            <span
                                class="inline-block w-2 h-4 bg-[#FF4E1A] animate-pulse rounded-sm"
                            ></span>
                        </div>
                    </div>
                </div>

                <div id="chat-bottom"></div>
            </div>
        </div>

        <!-- Error bar -->
        <div
            v-if="error"
            class="mx-6 mb-2 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 shrink-0"
        >
            <span>{{ error }}</span>
            <button
                type="button"
                @click="retry"
                class="text-red-600 font-semibold hover:underline ml-4 shrink-0"
            >
                Retry
            </button>
        </div>

        <!-- Input area -->
        <div class="px-6 pb-4 pt-2 shrink-0">
            <!-- Quick action chips -->
            <div class="max-w-3xl mx-auto flex gap-2 justify-center mb-3">
                <button
                    type="button"
                    @click="sendQuickAction('Summarize my day')"
                    :disabled="isStreaming"
                    class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Summarize my day
                </button>
                <button
                    type="button"
                    @click="sendQuickAction('What\'s blocked?')"
                    :disabled="isStreaming"
                    class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    What's blocked?
                </button>
                <button
                    type="button"
                    @click="sendQuickAction('Am I free Thursday PM?')"
                    :disabled="isStreaming"
                    class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Am I free Thursday PM?
                </button>
            </div>

            <!-- Input bar -->
            <div
                class="max-w-3xl mx-auto flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2.5 shadow-sm"
            >
                <svg
                    class="w-4 h-4 text-[#FF4E1A] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
                <input
                    v-model="input"
                    @keyup.enter="handleSend"
                    :disabled="isStreaming"
                    type="text"
                    placeholder="Ask anything…"
                    class="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed"
                />
                <button
                    type="button"
                    @click="handleSend"
                    :disabled="isStreaming || !input.trim()"
                    class="bg-[#FF4E1A] hover:bg-[#E6431A] text-white px-5 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    Ask →
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-ai-content :deep(p) {
    margin-bottom: 0.5rem;
}
.chat-ai-content :deep(p:last-child) {
    margin-bottom: 0;
}
.chat-ai-content :deep(ul),
.chat-ai-content :deep(ol) {
    margin: 0.5rem 0;
    padding-left: 1.25rem;
}
.chat-ai-content :deep(li) {
    margin-bottom: 0.25rem;
}
.chat-ai-content :deep(code) {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.8125rem;
}
.chat-ai-content :deep(pre) {
    background: #f3f4f6;
    padding: 0.75rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 0.5rem 0;
}
.chat-ai-content :deep(pre code) {
    background: transparent;
    padding: 0;
}
.chat-ai-content :deep(strong) {
    font-weight: 600;
}
.chat-ai-content :deep(em) {
    font-style: italic;
}
</style>
