<script setup lang="ts">
import { ref } from 'vue';
import ChatBrowserModal from './ChatBrowserModal.vue';

export interface ChatEntry {
  name: string;
  id: string;
}

const props = defineProps<{
  phone: string;
  chats?: ChatEntry[];
}>();

const emit = defineEmits<{
  save: [chats: ChatEntry[]];
  disconnect: [];
}>();

const chatList = ref<ChatEntry[]>(props.chats ?? []);
const saving = ref(false);
const openBrowser = ref(false);

function onBrowserSelect(chats: ChatEntry[]) {
  const existing = new Set(chatList.value.map(c => c.id));
  for (const chat of chats) {
    if (!existing.has(chat.id)) {
      chatList.value.push(chat);
    }
  }
}

function removeChat(index: number) {
  chatList.value.splice(index, 1);
}

async function onSave() {
  saving.value = true;
  try {
    emit('save', chatList.value);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Connected</h3>
        <p class="text-sm text-gray-500">{{ phone }}</p>
      </div>
      <span class="px-2.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
        Connected
      </span>
    </div>

    <div>
      <div class="flex items-center justify-between mb-1">
        <label class="text-sm font-medium text-gray-700">Chats to monitor</label>
        <button
          @click="openBrowser = true"
          class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Browse chats
        </button>
      </div>

      <div v-if="chatList.length > 0" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="(chat, i) in chatList"
          :key="chat.id"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-[#FF8C4B]/10 text-[#FF8C4B] rounded-full"
          :title="chat.id"
        >
          {{ chat.name }}
          <button
            @click="removeChat(i)"
            class="text-[#FF8C4B] hover:text-red-600 text-lg leading-none"
          >&times;</button>
        </span>
      </div>
      <p v-else class="text-sm text-gray-400 mt-2">No chats added yet. Click "Browse chats" to select.</p>
    </div>

    <div class="flex gap-3">
      <button
        @click="onSave"
        :disabled="saving"
        class="flex-1 px-4 py-2 text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] disabled:opacity-50 transition-colors font-medium"
      >
        {{ saving ? 'Saving...' : 'Save Chats' }}
      </button>
      <button
        @click="emit('disconnect')"
        class="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        Disconnect
      </button>
    </div>

    <ChatBrowserModal
      :open="openBrowser"
      :existing="chatList"
      @close="openBrowser = false"
      @select="onBrowserSelect"
    />
  </div>
</template>
