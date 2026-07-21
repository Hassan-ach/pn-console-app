<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  phone: string;
  chats?: string[];
  resolveChat?: (identifier: string) => Promise<{ title: string; id: string } | null>;
}>();

const emit = defineEmits<{
  save: [chats: string[]];
  disconnect: [];
}>();

const chatInput = ref('');
const chatList = ref<string[]>(props.chats ?? []);
const saving = ref(false);
const resolving = ref(false);

async function addChat() {
  const val = chatInput.value.trim();
  if (!val) return;
  if (chatList.value.includes(val)) return;

  if (props.resolveChat) {
    resolving.value = true;
    const entity = await props.resolveChat(val);
    resolving.value = false;
    if (!entity) {
      alert('Could not resolve chat. Check the username/ID and try again.');
      return;
    }
    const label = entity.title !== val ? `${entity.title} (${val})` : val;
    chatList.value.push(label);
  } else {
    chatList.value.push(val);
  }
  chatInput.value = '';
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
      <label class="block text-sm font-medium text-gray-700 mb-1">Chats to monitor</label>
      <p class="text-xs text-gray-400 mb-2">
        Enter @usernames or numeric chat IDs. Press Enter or click Add.
      </p>
      <div class="flex gap-2">
        <input
          v-model="chatInput"
          type="text"
          placeholder="@channel or -100123456789"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/40 focus:border-[#FF8C4B]"
          @keydown.enter.prevent="addChat"
        />
        <button
          @click="addChat"
          :disabled="resolving"
          class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {{ resolving ? 'Resolving...' : 'Add' }}
        </button>
      </div>

      <div v-if="chatList.length > 0" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="(chat, i) in chatList"
          :key="i"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-sm bg-[#FF8C4B]/10 text-[#FF8C4B] rounded-full"
        >
          {{ chat }}
          <button
            @click="removeChat(i)"
            class="text-[#FF8C4B] hover:text-red-600 text-lg leading-none"
          >&times;</button>
        </span>
      </div>
      <p v-else class="text-sm text-gray-400 mt-2">No chats added yet.</p>
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
  </div>
</template>
