<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { fetchTelegramDialogs, type DialogEntry } from '../../../composables/useTelegramDialogs';
import type { ChatEntry } from './ChatConfigForm.vue';

const props = defineProps<{
  open: boolean;
  existing: ChatEntry[];
}>();

const emit = defineEmits<{
  close: [];
  select: [chats: ChatEntry[]];
}>();

const loading = ref(false);
const error = ref('');
const dialogs = ref<DialogEntry[]>([]);
const search = ref('');
const selectedIds = ref<Set<string>>(new Set());

const filtered = computed(() => {
  const term = search.value.toLowerCase();
  if (!term) return dialogs.value;
  return dialogs.value.filter((d: DialogEntry) => d.name.toLowerCase().includes(term));
});

const selectedCount = computed(() => selectedIds.value.size);

watch(() => props.open, async (isOpen) => {
  if (!isOpen) return;
  search.value = '';
  selectedIds.value = new Set(props.existing.map(c => c.id));
  await loadDialogs();
});

async function loadDialogs() {
  loading.value = true;
  error.value = '';
  try {
    dialogs.value = await fetchTelegramDialogs();
  } catch (err: any) {
    error.value = err.message ?? 'Could not load chats.';
  } finally {
    loading.value = false;
  }
}

function toggle(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function confirm() {
  const selected = dialogs.value
    .filter((d: DialogEntry) => selectedIds.value.has(d.id))
    .map((d: DialogEntry) => ({ name: d.name, id: d.id }));
  emit('select', selected);
  emit('close');
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === (e.currentTarget as HTMLElement)) {
    emit('close');
  }
}

function avatarColor(name: string) {
  const colors = ['#FF8C4B', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#FF5722', '#607D8B'];
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click="onBackdropClick"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 flex-1">Your Telegram chats</h2>
          <button
            @click="emit('close')"
            class="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >&times;</button>
        </div>

        <!-- Search -->
        <div class="px-5 py-3 border-b border-gray-100">
          <input
            v-model="search"
            type="text"
            placeholder="Search chats..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/40 focus:border-[#FF8C4B]"
          />
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-5 py-2">
          <!-- Loading -->
          <template v-if="loading">
            <div v-for="i in 6" :key="i" class="flex items-center gap-3 py-3 border-b border-gray-50">
              <div class="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div class="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
              </div>
            </div>
          </template>

          <!-- Error -->
          <div v-else-if="error" class="py-12 text-center">
            <p class="text-sm text-red-600 mb-3">{{ error }}</p>
            <button
              @click="loadDialogs"
              class="px-4 py-2 text-sm font-medium text-[#FF8C4B] bg-[#FF8C4B]/10 rounded-lg hover:bg-[#FF8C4B]/20 transition-colors"
            >Retry</button>
          </div>

          <!-- Empty -->
          <div v-else-if="filtered.length === 0" class="py-12 text-center">
            <p class="text-sm text-gray-400">No chats found</p>
          </div>

          <!-- List -->
          <template v-else>
            <div
              v-for="dialog in filtered"
              :key="dialog.id"
              @click="toggle(dialog.id)"
              class="flex items-center gap-3 py-3 px-2 border-b border-gray-50 cursor-pointer rounded-lg transition-colors"
              :class="selectedIds.has(dialog.id) ? 'bg-[#FF8C4B]/10' : 'hover:bg-gray-50'"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                :style="{ backgroundColor: avatarColor(dialog.name) }"
              >
                {{ dialog.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate">{{ dialog.name }}</div>
                <span class="inline-block mt-0.5 px-1.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 rounded-full capitalize">
                  {{ dialog.type }}
                </span>
              </div>
              <svg
                v-if="selectedIds.has(dialog.id)"
                class="w-5 h-5 text-[#FF8C4B] shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">
          <span class="text-sm text-gray-500">
            {{ selectedCount }} selected
          </span>
          <button
            @click="confirm"
            :disabled="selectedCount === 0"
            class="px-5 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] disabled:opacity-50 transition-colors"
          >
            Add selected
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
