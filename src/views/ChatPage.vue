<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github-dark.css';
import { useChat } from '../composables/useChat';
import { useExternalLinks } from '../composables/useExternalLinks';
import ConversationSidebar from '../components/ConversationSidebar.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { ChatMessage } from '../api/chat-api';

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
    isFailedResponse,
    retryFailedMessage,
    switchConversation,
    startNewChat,
    deleteConversation,
    toggleSidebar,
    scrollToBottom,
    handleScroll,
} = useChat();

const { pendingLink, handleLinkClick, confirmOpen, cancel } =
    useExternalLinks();

marked.setOptions({
    breaks: true,
    gfm: true,
});

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const renderer = new marked.Renderer();
renderer.code = ({ text, lang, escaped }) => {
    let source = text;
    if (escaped) {
        source = source
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&');
    }

    const language = lang && hljs.getLanguage(lang) ? lang : '';
    let highlighted = source;
    try {
        highlighted = language
            ? hljs.highlight(source, { language, ignoreIllegals: true }).value
            : hljs.highlightAuto(source).value;
    } catch {
        highlighted = escapeHtml(source);
    }

    const label = escapeHtml(lang || 'text');
    const langClass = language ? ` language-${escapeHtml(language)}` : '';
    return [
        '<div class="code-block">',
        `<div class="code-block-header"><span class="code-lang">${label}</span><button type="button" class="copy-code-btn" aria-label="Copy code">Copy</button></div>`,
        `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`,
        '</div>',
    ].join('');
};

function renderMarkdown(content: string): string {
    return DOMPurify.sanitize(marked.parse(content, { renderer }) as string);
}

async function handleCodeCopy(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('.copy-code-btn');
    if (!button) return;
    const code = button.closest('.code-block')?.querySelector('code');
    if (!code) return;
    try {
        await navigator.clipboard.writeText(code.textContent ?? '');
    } catch {
        return;
    }
    const label = button.textContent;
    button.textContent = 'Copied';
    button.classList.add('copied');
    window.setTimeout(() => {
        button.textContent = label;
        button.classList.remove('copied');
    }, 1600);
}

function handleChatClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.copy-code-btn')) {
        handleCodeCopy(event);
        return;
    }
    handleLinkClick(event);
}

const copiedMessageId = ref<string | null>(null);

async function copyMessage(message: ChatMessage) {
    try {
        await navigator.clipboard.writeText(message.content);
    } catch {
        return;
    }
    copiedMessageId.value = message.id;
    window.setTimeout(() => {
        if (copiedMessageId.value === message.id) {
            copiedMessageId.value = null;
        }
    }, 1600);
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

const messageInputRef = ref<HTMLInputElement | null>(null);

function handleSend() {
    if (!input.value.trim() || isStreaming.value) return;
    sendMessage(input.value);
}

function sendQuickAction(prompt: string) {
    if (isStreaming.value) return;
    input.value = prompt;
    messageInputRef.value?.focus();
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

// Build message groups with date divider info
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
                    @click="handleChatClick"
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
                                <div v-if="item.message.role === 'USER'" class="flex flex-col items-end max-w-[65%]">
                                    <div
                                        class="px-3.5 py-2.5 bg-[#FF4E1A] text-white text-[13px] leading-relaxed break-words"
                                        style="border-radius: 14px 14px 4px 14px"
                                    >
                                        {{ item.message.content }}
                                    </div>
                                    <div v-if="item.message.content" class="flex items-center gap-1.5 mt-1.5 pr-0.5">
                                        <button
                                            type="button"
                                            @click="copyMessage(item.message)"
                                            class="flex items-center gap-1 text-[10px] font-medium text-[#9E9A90] hover:text-[#5A564E] transition-colors duration-150 cursor-pointer bg-transparent border-none p-0.5"
                                        >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2"/>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                            </svg>
                                            {{ copiedMessageId === item.message.id ? 'Copied' : 'Copy' }}
                                        </button>
                                        <span class="text-[10px] text-[#B8B4AA]">{{ formatTime(item.message.createdAt) }}</span>
                                    </div>
                                </div>

                                <div v-else class="max-w-[75%] w-full flex items-start gap-2.5">
                                    <div class="w-7 h-7 shrink-0 rounded-full bg-[#FF4E1A]/10 border border-[#FF4E1A]/25 flex items-center justify-center text-[#FF4E1A] mt-0.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                        </svg>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div
                                            v-if="!item.message.content && isStreaming && item.message === messages[messages.length - 1]"
                                            class="inline-flex items-center gap-1.5 bg-white border border-[#E4E2DC] rounded-[12px] px-4 py-3.5"
                                        >
                                            <span class="w-1.5 h-1.5 rounded-full bg-[#CECCBF] typing-dot"></span>
                                            <span class="w-1.5 h-1.5 rounded-full bg-[#CECCBF] typing-dot"></span>
                                            <span class="w-1.5 h-1.5 rounded-full bg-[#CECCBF] typing-dot"></span>
                                        </div>
                                        <div
                                            v-else-if="item.message.content"
                                            class="bg-white border border-[#E4E2DC] rounded-[12px] px-4 py-3.5 text-[13px] text-[#5A564E] leading-[1.65] ai-content shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                                            v-html="renderMarkdown(item.message.content)"
                                        ></div>
                                        <div v-if="item.message.content" class="flex items-center gap-1.5 mt-1.5 pl-0.5">
                                            <button
                                                type="button"
                                                @click="copyMessage(item.message)"
                                                class="flex items-center gap-1 text-[10px] font-medium text-[#9E9A90] hover:text-[#5A564E] transition-colors duration-150 cursor-pointer bg-transparent border-none p-0.5"
                                            >
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                                </svg>
                                                {{ copiedMessageId === item.message.id ? 'Copied' : 'Copy' }}
                                            </button>
                                            <span class="text-[10px] text-[#B8B4AA]">{{ formatTime(item.message.createdAt) }}</span>
                                        </div>
                                        <div
                                            v-if="isFailedResponse(item.message.content)"
                                            class="flex items-center gap-1.5 mt-1 pl-0.5"
                                        >
                                            <button
                                                type="button"
                                                @click="retryFailedMessage(item.message.id)"
                                                class="flex items-center gap-1 text-[10px] font-medium text-[#FF4E1A] hover:text-[#E33F10] transition-colors duration-150 cursor-pointer bg-transparent border-none p-0.5"
                                            >
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="23 4 23 10 17 10"/>
                                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                                </svg>
                                                Retry
                                            </button>
                                        </div>
                                    </div>
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
                        ref="messageInputRef"
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

        <ConfirmDialog
            :open="pendingLink !== null"
            title="Open external link?"
            :message="
                pendingLink
                    ? `This will open ${pendingLink} in your default browser. Do you want to continue?`
                    : ''
            "
            confirmLabel="Open link"
            cancelLabel="Cancel"
            @confirm="confirmOpen"
            @cancel="cancel"
        />
    </div>
</template>

<style scoped>
.ai-content :deep(p) { margin-bottom: 0.75rem; line-height: 1.7; }
.ai-content :deep(p:last-child) { margin-bottom: 0; }
.ai-content :deep(ul), .ai-content :deep(ol) { margin: 0.5rem 0 0.75rem; padding-left: 1.375rem; }
.ai-content :deep(ul) { list-style: disc; }
.ai-content :deep(ol) { list-style: decimal; }
.ai-content :deep(li) { margin-bottom: 0.3rem; line-height: 1.65; }
.ai-content :deep(li:last-child) { margin-bottom: 0; }
.ai-content :deep(li > ul), .ai-content :deep(li > ol) { margin: 0.2rem 0 0.35rem; }
.ai-content :deep(li::marker) { color: #FF4E1A; font-weight: 600; }
.ai-content :deep(h1), .ai-content :deep(h2), .ai-content :deep(h3), .ai-content :deep(h4) {
    font-weight: 700;
    color: #1A1A16;
    line-height: 1.3;
    margin: 1.25rem 0 0.5rem;
}
.ai-content :deep(h1:first-child), .ai-content :deep(h2:first-child),
.ai-content :deep(h3:first-child), .ai-content :deep(h4:first-child) { margin-top: 0; }
.ai-content :deep(h1) { font-size: 1.2rem; }
.ai-content :deep(h2) { font-size: 1.05rem; padding-bottom: 0.25rem; border-bottom: 1px solid #E4E2DC; }
.ai-content :deep(h3) { font-size: 0.95rem; }
.ai-content :deep(h4) { font-size: 0.875rem; }
.ai-content :deep(strong) { font-weight: 600; color: #1A1A16; }
.ai-content :deep(em) { font-style: italic; }
.ai-content :deep(a) { color: #FF4E1A; text-decoration: underline; text-underline-offset: 2px; }
.ai-content :deep(a:hover) { color: #E33F10; }
.ai-content :deep(hr) { border: none; border-top: 1px solid #E4E2DC; margin: 1rem 0; }
.ai-content :deep(blockquote) {
    border-left: 3px solid #FF4E1A;
    padding: 8px 12px;
    background: #FBF4F0;
    border-radius: 0 8px 8px 0;
    color: #5A564E;
    margin: 0.75rem 0;
}
.ai-content :deep(blockquote p:last-child) { margin-bottom: 0; }
.ai-content :deep(input[type='checkbox']) {
    appearance: none;
    width: 13px;
    height: 13px;
    border: 1.5px solid #CECCBF;
    border-radius: 3px;
    vertical-align: -2px;
    margin-right: 6px;
    position: relative;
    cursor: default;
}
.ai-content :deep(input[type='checkbox']:checked) {
    background: #FF4E1A;
    border-color: #FF4E1A;
}
.ai-content :deep(input[type='checkbox']:checked::after) {
    content: '';
    position: absolute;
    left: 3.5px;
    top: 0.5px;
    width: 4px;
    height: 7px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.ai-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0;
    font-size: 12.5px;
    border-radius: 8px;
    overflow: hidden;
}
.ai-content :deep(table:last-child) { margin-bottom: 0; }
.ai-content :deep(th) {
    background: #F2F1EE;
    color: #1A1A16;
    font-weight: 600;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #E4E2DC;
}
.ai-content :deep(td) {
    padding: 7px 10px;
    border: 1px solid #E4E2DC;
    vertical-align: top;
}
.ai-content :deep(tbody tr:nth-child(even)) { background: #FAF9F6; }

.ai-content :deep(code) {
    background: #EAE9E5;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
}

.ai-content :deep(.code-block) {
    margin: 0.75rem 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #21262D;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.ai-content :deep(.code-block:first-child) { margin-top: 0; }
.ai-content :deep(.code-block:last-child) { margin-bottom: 0; }
.ai-content :deep(.code-block-header) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 12px;
    background: #161B22;
    border-bottom: 1px solid #21262D;
}
.ai-content :deep(.code-lang) {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8B949E;
    font-family: 'DM Mono', monospace;
}
.ai-content :deep(.copy-code-btn) {
    font-size: 10px;
    font-weight: 600;
    color: #8B949E;
    background: transparent;
    border: 1px solid #30363D;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.ai-content :deep(.copy-code-btn:hover) {
    color: #E6EDF3;
    border-color: #8B949E;
    background: rgba(139, 148, 158, 0.1);
}
.ai-content :deep(.copy-code-btn.copied) { color: #3FB950; border-color: #3FB950; }
.ai-content :deep(pre) {
    margin: 0;
    border-radius: 0;
    background: #0D1117;
    padding: 12px 14px;
    overflow-x: auto;
}
.ai-content :deep(pre code) {
    background: transparent;
    padding: 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: #C9D1D9;
}

.typing-dot {
    animation: typing-bounce 1.2s infinite ease-in-out;
}
.typing-dot:nth-child(2) { animation-delay: 0.15s; }
.typing-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes typing-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
    30% { transform: translateY(-3px); opacity: 1; }
}
</style>
