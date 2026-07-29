<script setup lang="ts">
import { ref, watch } from 'vue';
import AlertBanner from '../AlertBanner.vue';
import ChatBrowserModal from '../settings/telegram/ChatBrowserModal.vue';
import type { ChatEntry } from '../settings/telegram/ChatBrowserModal.vue';
import ConfirmDialog from '../ConfirmDialog.vue';

export interface ChatItem {
  id: string;
  name: string;
  historyLimit: number | null;
}

const props = defineProps<{
  open: boolean;
  pluginName: string;
  chats: ChatItem[];
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [chats: ChatItem[]];
  disconnect: [];
  'clear-error': [];
}>();

const browserOpen = ref(false);
const showDisconnectDialog = ref(false);
const localChats = ref<ChatItem[]>([]);

watch(
  [() => props.open, () => props.chats],
  ([isOpen]) => {
    if (isOpen) {
      localChats.value = props.chats.map((c) => ({
        id: c.id,
        name: c.name,
        historyLimit: c.historyLimit ?? null,
      }));
    }
  },
  { immediate: true, deep: true },
);

function removeChat(id: string) {
  localChats.value = localChats.value.filter((c) => c.id !== id);
}

function onBrowserSelect(selected: ChatEntry[]) {
  const existingIds = new Set(localChats.value.map((c) => c.id));
  for (const item of selected) {
    if (!existingIds.has(item.id)) {
      localChats.value.push({ id: item.id, name: item.name, historyLimit: null });
    }
  }
}

function onSave() {
  emit('save', localChats.value);
}

function promptDisconnect() {
  showDisconnectDialog.value = true;
}

function confirmDisconnect() {
  showDisconnectDialog.value = false;
  emit('disconnect');
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('close')"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div
          class="flex items-center justify-between p-5 border-b border-gray-100"
        >
          <h2 class="text-lg font-bold text-gray-900 capitalize">
            {{ pluginName }} configuration
          </h2>
          <button
            type="button"
            @click="emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="p-5 space-y-5">
          <AlertBanner
            v-if="error"
            type="error"
            :message="error"
            @dismiss="emit('clear-error')"
          />

          <!-- Chats section -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700"
                >Chats to monitor</label
              >
              <button
                type="button"
                @click="browserOpen = true"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Browse chats
              </button>
            </div>

            <div v-if="localChats.length > 0" class="space-y-2">
              <div
                v-for="chat in localChats"
                :key="chat.id"
                class="flex items-center gap-2 py-2 px-3 rounded-lg border border-gray-200"
              >
                <span class="flex-1 text-sm text-gray-700 truncate min-w-0">{{
                  chat.name
                }}</span>
                <input
                  v-model.number="chat.historyLimit"
                  type="number"
                  min="0"
                  placeholder="Limit"
                  class="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/30 focus:border-[#FF8C4B] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Max messages to extract (empty = all)"
                />
                <button
                  type="button"
                  @click="removeChat(chat.id)"
                  class="text-xs text-red-500 hover:text-red-700 cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400">
              No chats added yet. Click "Browse chats" to select.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              @click="promptDisconnect"
              :disabled="saving"
              class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Disconnect
            </button>
            <div class="flex-1" />
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="onSave"
              :disabled="saving"
              class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {{ saving ? 'Saving…' : 'Save config' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <ChatBrowserModal
    :open="browserOpen"
    :existing="localChats.map((c) => ({ name: c.name, id: c.id }))"
    @close="browserOpen = false"
    @select="onBrowserSelect"
  />

  <ConfirmDialog
    :open="showDisconnectDialog"
    :title="`Disconnect ${pluginName}?`"
    message="This will sign you out of this integration and clear your saved configuration. You can reconnect at any time."
    confirm-label="Disconnect"
    cancel-label="Cancel"
    @confirm="confirmDisconnect"
    @cancel="showDisconnectDialog = false"
  />
</template>
