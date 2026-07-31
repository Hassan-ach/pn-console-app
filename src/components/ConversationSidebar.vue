<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Conversation } from '../api/chat-api';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps<{
    conversations: Conversation[];
    activeId: string | null;
    open: boolean;
}>();

const emit = defineEmits<{
    select: [id: string];
    newChat: [];
    toggle: [];
    delete: [id: string];
}>();

const pendingDeleteId = ref<string | null>(null);

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

type DateBucket = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Last Month' | 'Older';

function getDateBucket(dateStr: string): DateBucket {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    if (date >= startOfWeek) return 'Previous 7 Days';
    if (date >= startOfLastMonth) return 'Last Month';
    return 'Older';
}

const groupedConversations = computed(() => {
    const buckets: Record<DateBucket, Conversation[]> = {
        Today: [],
        Yesterday: [],
        'Previous 7 Days': [],
        'Last Month': [],
        Older: [],
    };

    for (const conv of props.conversations) {
        const bucket = getDateBucket(conv.updatedAt);
        buckets[bucket].push(conv);
    }

    return Object.entries(buckets).filter(([, convs]) => convs.length > 0);
});

function truncateTitle(title: string, max = 50): string {
    return title.length > max ? title.slice(0, max) + '…' : title;
}
</script>

<template>
    <aside
        :class="[
            'flex flex-col bg-white border-r border-[#E4E2DC] transition-all duration-300 overflow-hidden shrink-0',
            open ? 'w-[260px]' : 'w-0',
        ]"
    >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#E4E2DC] shrink-0">
            <span class="text-xs font-bold text-[#5A564E] tracking-[0.04em] uppercase">History</span>
            <button
                type="button"
                @click="emit('toggle')"
                class="p-1 rounded hover:bg-[#F2F1EE] text-[#9E9A90] hover:text-[#5A564E] transition-colors duration-200 cursor-pointer bg-transparent border-none"
                title="Close sidebar"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>

        <!-- New Chat button -->
        <button
            type="button"
            @click="emit('newChat')"
            class="mx-3 mt-3 mb-2 px-3 py-2 rounded-[8px] bg-[#FF4E1A] text-white text-xs font-semibold hover:bg-[#FF6535] transition-colors duration-200 cursor-pointer border-none flex items-center gap-1.5"
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Chat
        </button>

        <!-- Conversation list -->
        <div class="flex-1 overflow-y-auto px-2 py-1 [scrollbar-width:thin] [scrollbar-color:#CECCBF_transparent]">
            <div v-for="[bucket, convs] in groupedConversations" :key="bucket">
                <div class="px-2 py-2 text-[10px] font-bold text-[#9E9A90] uppercase tracking-[0.04em]">
                    {{ bucket }}
                </div>
                <div
                    v-for="conv in convs"
                    :key="conv.id"
                    :class="[
                        'group flex items-center gap-1 px-3 py-2 rounded-[6px] text-xs transition-colors duration-150',
                        conv.id === activeId
                            ? 'bg-[#FF4E1A]/10 text-[#1A1A16]'
                            : 'text-[#5A564E] hover:bg-[#F2F1EE]',
                    ]"
                >
                    <button
                        type="button"
                        @click="emit('select', conv.id)"
                        class="flex-1 text-left min-w-0 cursor-pointer bg-transparent border-none"
                    >
                        <div class="font-medium truncate">{{ truncateTitle(conv.title) }}</div>
                        <div class="text-[10px] text-[#9E9A90] mt-0.5 flex items-center gap-1.5">
                            <span>{{ formatRelativeTime(conv.updatedAt) }}</span>
                            <span v-if="conv.messageCount > 0">· {{ conv.messageCount }} msgs</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        @click.stop="pendingDeleteId = conv.id"
                        class="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#E4E2DC] text-[#9E9A90] hover:text-red-600 transition-all duration-200 cursor-pointer bg-transparent border-none"
                        title="Delete conversation"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div v-if="conversations.length === 0" class="px-3 py-8 text-center text-[10px] text-[#9E9A90]">
                No conversations yet
            </div>
        </div>

        <ConfirmDialog
            :open="pendingDeleteId !== null"
            title="Delete conversation?"
            message="This will permanently delete the conversation and all its messages. This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            @confirm="pendingDeleteId !== null && (emit('delete', pendingDeleteId), pendingDeleteId = null)"
            @cancel="pendingDeleteId = null"
        />
    </aside>
</template>
