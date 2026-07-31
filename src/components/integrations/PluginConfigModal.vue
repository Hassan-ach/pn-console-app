<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import AlertBanner from '../AlertBanner.vue';
import ChatBrowserModal from '../settings/telegram/ChatBrowserModal.vue';
import type { ChatEntry } from '../settings/telegram/ChatBrowserModal.vue';
import ConfirmDialog from '../ConfirmDialog.vue';
import GenericConfigForm from './GenericConfigForm.vue';
import {
  PluginManagerClient,
  type ConfigFieldSchema,
  type ActivationRequirementResult,
} from '../../api/plugin-manager';

export interface ChatItem {
  id: string;
  name: string;
  historyLimit: number | null;
}

const props = defineProps<{
  open: boolean;
  pluginName: string;
  chats?: ChatItem[];
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', config: Record<string, any>): void;
  (e: 'disconnect'): void;
  (e: 'clear-error'): void;
}>();

const client = new PluginManagerClient();

const schema = ref<ConfigFieldSchema[]>([]);
const configData = ref<Record<string, any>>({});
const requirements = ref<ActivationRequirementResult[]>([]);
const loadingSchema = ref(false);
const fetchError = ref('');
const browserOpen = ref(false);
const showDisconnectDialog = ref(false);

watch(
  [() => props.open, () => props.pluginName],
  async ([isOpen, name]) => {
    if (isOpen && name) {
      loadingSchema.value = true;
      fetchError.value = '';
      try {
        const [loadedSchema, loadedConfig, loadedReqs] = await Promise.all([
          client.getConfigSchema(name).catch(() => []),
          client.getConfig(name).catch(() => ({})),
          client.getActivationRequirements(name).catch(() => []),
        ]);

        schema.value = loadedSchema;
        requirements.value = loadedReqs;

        const chatsList = (loadedConfig as any)?.chats ?? props.chats ?? [];
        const formattedChats = chatsList.map((c: any) => ({
          id: c.id,
          name: c.name,
          historyLimit: c.historyLimit ?? null,
        }));

        configData.value = {
          ...loadedConfig,
          chats: formattedChats,
        };

        if (schema.value.length === 0) {
          schema.value = [
            {
              key: 'chats',
              label: 'Chats / Channels to monitor',
              type: 'checkbox-list',
              required: true,
              description: 'Configure monitored chats or sources',
            },
          ];
        }
      } catch (err: any) {
        fetchError.value = err.message ?? 'Failed to load plugin schema';
      } finally {
        loadingSchema.value = false;
      }
    }
  },
  { immediate: true },
);

// Filter schema fields to activation requirements fields to prevent modifying login/auth credentials (e.g. apiId, apiHash)
const filteredSchema = computed(() => {
  if (!requirements.value || requirements.value.length === 0) {
    return schema.value;
  }
  const reqFields = new Set(requirements.value.map((r) => r.field));
  // Only include fields that match activation requirements
  const matched = schema.value.filter((f) => reqFields.has(f.key));
  return matched.length > 0 ? matched : schema.value;
});

function onBrowserSelect(selected: ChatEntry[]) {
  const currentChats: ChatItem[] = Array.isArray(configData.value.chats)
    ? [...configData.value.chats]
    : [];
  const existingIds = new Set(currentChats.map((c) => c.id));
  for (const item of selected) {
    if (!existingIds.has(item.id)) {
      currentChats.push({ id: item.id, name: item.name, historyLimit: null });
    }
  }
  configData.value = {
    ...configData.value,
    chats: currentChats,
  };
}

function onSave() {
  emit('save', configData.value);
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
          <AlertBanner type="error" :message="error || fetchError" @dismiss="emit('clear-error')" />

          <!-- Requirement notice if any requirement is not met -->
          <div
            v-for="req in requirements"
            :key="req.field"
            class="text-xs p-3 rounded-xl flex items-center gap-2"
            :class="
              req.met
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                : 'bg-amber-50 text-amber-800 border border-amber-100'
            "
          >
            <svg
              v-if="req.met"
              class="w-4 h-4 text-emerald-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-else
              class="w-4 h-4 text-amber-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{{ req.message }}</span>
          </div>

          <!-- Loading state -->
          <div v-if="loadingSchema" class="py-8 text-center text-sm text-gray-400 animate-pulse">
            Loading configuration options…
          </div>

          <!-- Dynamic Form (filtered to activation requirements fields) -->
          <GenericConfigForm
            v-else
            :schema="filteredSchema"
            v-model="configData"
            :disabled="saving"
            :plugin-name="pluginName"
            @browse-chats="browserOpen = true"
          />

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

  <!-- Telegram dialog selector modal -->
  <ChatBrowserModal
    v-if="pluginName === 'telegram'"
    :open="browserOpen"
    :existing="
      (configData.chats || []).map((c: any) => ({ name: c.name, id: c.id }))
    "
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
