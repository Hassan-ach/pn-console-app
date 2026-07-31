<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useChat } from '../composables/useChat';
import ConversationSidebar from '../components/ConversationSidebar.vue';

const {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    isStreaming,
    error,
    input,
    isAtBottom,
    sidebarOpen,
    loadConversations,
    sendMessage,
    stopGenerating,
    retry,
    switchConversation,
    startNewChat,
    deleteConversation,
    toggleSidebar,
    scrollToBottom,
    handleScroll,
} = useChat();

marked.setOptions({
    breaks: true,
    gfm: true,
});

function renderMarkdown(content: string): string {
    return DOMPurify.sanitize(marked.parse(content) as string);
}

function handleSend() {
    if (!input.value.trim() || isStreaming.value) return;
    sendMessage(input.value);
}

function sendQuickAction(prompt: string) {
    if (isStreaming.value) return;
    sendMessage(prompt);
}

function formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

function getDateKey(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface MessageGroup {
    type: 'divider';
    label: string;
    key: string;
}
type DisplayItem = MessageGroup | { type: 'message'; message: typeof messages.value[0] };

const displayItems = computed<DisplayItem[]>(() => {
    const items: DisplayItem[] = [];
    let lastDateKey: string | null = null;

    for (const msg of messages.value) {
        const dateKey = getDateKey(msg.createdAt);
        if (dateKey !== lastDateKey) {
            items.push({
                type: 'divider',
                label: formatDateLabel(msg.createdAt),
                key: `divider-${dateKey}`,
            });
            lastDateKey = dateKey;
        }
        items.push({ type: 'message', message: msg });
    }

    return items;
});

onMounted(() => {
    loadConversations();
});
</script>

<template>
    <div class="-m-8 flex overflow-hidden bg-[#F8F7F4]" style="height: calc(100vh - 72px)">
        <!-- Sidebar -->
        <ConversationSidebar
            :conversations="conversations"
            :activeId="activeConversationId"
            :open="sidebarOpen"
            @select="switchConversation"
            @newChat="startNewChat"
            @delete="deleteConversation"
            @toggle="toggleSidebar"
        />

        <!-- Main chat area -->
        <div class="flex flex-col flex-1 overflow-hidden">
            <!-- Header -->
            <div class="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#E4E2DC] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] shrink-0">
                <!-- Sidebar toggle -->
                <button
                    type="button"
                    @click="toggleSidebar"
                    class="p-1 rounded hover:bg-[#F2F1EE] text-[#9E9A90] hover:text-[#5A564E] transition-colors duration-200 cursor-pointer bg-transparent border-none"
                    title="Toggle history sidebar"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>

                <!-- Badge -->
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#FF4E1A]/10 text-[#FF4E1A] text-[11px] font-bold tracking-[0.04em] uppercase">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Ask
                </div>

                <!-- New Chat button -->
                <button
                    type="button"
                    @click="startNewChat"
                    class="ml-auto text-xs text-[#9E9A90] border border-[#E4E2DC] rounded px-2.5 py-1 hover:border-[#CECCBF] hover:text-[#5A564E] transition-all duration-200 cursor-pointer bg-transparent flex items-center gap-1"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Chat
                </button>
            </div>

            <!-- Chat Messages -->
            <div class="flex-1 relative overflow-hidden">
                <div
                    id="chat-messages"
                    @scroll="handleScroll"
                    class="absolute inset-0 overflow-y-auto px-5 py-5 flex flex-col gap-3.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#CECCBF_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#CECCBF] [&::-webkit-scrollbar-thumb]:rounded"
                >
                    <!-- Loading -->
                    <div v-if="isLoading" class="flex-1 flex items-center justify-center h-full">
                        <div class="w-6 h-6 border-2 border-[#CECCBF] border-t-[#FF4E1A] rounded-full animate-spin"></div>
                    </div>

                    <!-- Empty state -->
                    <div v-else-if="messages.length === 0 && !isStreaming" class="flex-1 flex flex-col items-center justify-center gap-3 h-full text-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF4E1A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-60">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <p class="text-sm italic text-[#9E9A90]">Ask me anything about your insights and messages.</p>
                    </div>

                    <!-- Messages with date dividers -->
                    <template v-else>
                        <template v-for="item in displayItems" :key="item.type === 'divider' ? item.key : item.message.id">
                            <!-- Date divider -->
                            <div v-if="item.type === 'divider'" class="flex items-center gap-3 py-1">
                                <div class="flex-1 h-px bg-[#E4E2DC]"></div>
                                <span class="text-[10px] font-bold text-[#9E9A90] uppercase tracking-[0.04em] shrink-0">{{ item.label }}</span>
                                <div class="flex-1 h-px bg-[#E4E2DC]"></div>
                            </div>

                            <!-- Message bubble -->
                            <div v-else :class="item.message.role === 'USER' ? 'flex justify-end' : 'flex justify-start'">
                                <div
                                    v-if="item.message.role === 'USER'"
                                    class="max-w-[65%] px-3.5 py-2.5 bg-[#FF4E1A] text-white text-[13px] leading-relaxed"
                                    style="border-radius: 14px 14px 4px 14px"
                                >
                                    {{ item.message.content }}
                                </div>

                                <div v-else class="max-w-[75%] w-full">
                                    <div
                                        v-if="!item.message.content && isStreaming && item.message === messages[messages.length - 1]"
                                        class="inline-block w-2 h-4 bg-[#FF4E1A] rounded-sm animate-pulse"
                                    ></div>
                                    <div
                                        v-else-if="item.message.content"
                                        class="bg-white border border-[#E4E2DC] rounded-[10px] px-4 py-3.5 text-[13px] text-[#5A564E] leading-[1.65] ai-content"
                                        v-html="renderMarkdown(item.message.content)"
                                    ></div>
                                </div>
                            </div>
                        </template>
                        <div id="chat-bottom"></div>
                    </template>
                </div>

                <!-- Scroll-to-bottom button -->
                <button
                    v-show="messages.length > 0 && !isAtBottom"
                    @click="scrollToBottom"
                    type="button"
                    class="group absolute bottom-4 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E4E2DC] shadow-md hover:shadow-lg hover:border-[#CECCBF] transition-all duration-200 cursor-pointer z-10"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E9A90" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:stroke-[#FF4E1A] transition-colors duration-200">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
            </div>

            <!-- Error bar -->
            <div
                v-if="error"
                class="mx-5 mb-2 flex items-center justify-between bg-red-50 border border-red-200 rounded-[6px] px-3.5 py-2.5 text-[13px] text-red-700 shrink-0"
            >
                <span>{{ error }}</span>
                <button
                    type="button"
                    @click="retry"
                    class="text-red-600 font-semibold underline ml-4 shrink-0 cursor-pointer bg-transparent border-none text-xs"
                >
                    Retry
                </button>
            </div>

            <!-- Input area -->
            <div class="px-5 py-3.5 border-t border-[#E4E2DC] bg-[#F8F7F4] shrink-0">
                <div class="flex gap-1.5 flex-wrap mb-2.5">
                    <div
                        v-for="chip in ['Summarize my day', `What's blocked?`, 'Am I free Thursday PM?']"
                        :key="chip"
                        @click="sendQuickAction(chip)"
                        :class="[
                            'px-2.5 py-1 rounded-full border text-xs text-[#9E9A90] cursor-pointer transition-all duration-200 select-none',
                            isStreaming
                                ? 'border-[#E4E2DC] opacity-40 pointer-events-none'
                                : 'border-[#CECCBF] hover:border-[#FF4E1A] hover:text-[#5A564E]'
                        ]"
                    >
                        {{ chip }}
                    </div>
                </div>

                <div class="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-[#E4E2DC] rounded-[24px] focus-within:border-[#CECCBF] transition-all duration-200">
                    <div class="flex items-center shrink-0 text-[#FF4E1A]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                    </div>
                    <input
                        v-model="input"
                        @keyup.enter="handleSend"
                        type="text"
                        placeholder="Ask anything…"
                        class="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] text-[#5A564E] placeholder-[#9E9A90]"
                    />
                    <button
                        v-if="isStreaming"
                        type="button"
                        @click="stopGenerating"
                        class="shrink-0 px-3.5 py-1 rounded-[20px] bg-[#9E9A90] text-white text-xs font-semibold whitespace-nowrap transition-all duration-200 hover:bg-[#5A564E] cursor-pointer border-none flex items-center gap-1"
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                        Stop
                    </button>
                    <button
                        v-else
                        type="button"
                        @click="handleSend"
                        :disabled="!input.trim()"
                        class="shrink-0 px-3.5 py-1 rounded-[20px] bg-[#FF4E1A] text-white text-xs font-semibold whitespace-nowrap transition-all duration-200 hover:bg-[#FF6535] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer border-none"
                    >
                        Ask →
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.ai-content :deep(p) { margin-bottom: 0.5rem; }
.ai-content :deep(p:last-child) { margin-bottom: 0; }
.ai-content :deep(ul), .ai-content :deep(ol) { margin: 0.5rem 0; padding-left: 1.25rem; }
.ai-content :deep(li) { margin-bottom: 0.25rem; }
.ai-content :deep(code) {
    background: #EAE9E5;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
}
.ai-content :deep(pre) {
    background: #EAE9E5;
    padding: 0.75rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.5rem 0;
}
.ai-content :deep(pre code) { background: transparent; padding: 0; }
.ai-content :deep(strong) { font-weight: 600; color: #1A1A16; }
.ai-content :deep(em) { font-style: italic; }
.ai-content :deep(h1), .ai-content :deep(h2), .ai-content :deep(h3) {
    font-weight: 700;
    color: #1A1A16;
    margin-bottom: 0.5rem;
}
.ai-content :deep(blockquote) {
    border-left: 3px solid #CECCBF;
    padding: 8px 12px;
    background: #F2F1EE;
    border-radius: 0 6px 6px 0;
    font-style: italic;
    color: #5A564E;
    margin: 0.5rem 0;
}
</style>
