<script setup lang="ts">
import type { PluginActivationStatus, PluginStatus } from '../../api/plugin-manager';
import type { ChatItem } from './PluginConfigModal.vue';

const props = defineProps<{
  open: boolean;
  pluginName: string;
  status: PluginStatus;
  activation: PluginActivationStatus | null;
  configChats: ChatItem[];
}>();

const emit = defineEmits<{
  close: [];
}>();

function getChatLimit(chatId: string): string {
  const match = props.configChats.find((c) => c.id === chatId);
  if (match && match.historyLimit != null) {
    return `${match.historyLimit} msgs`;
  }
  return 'Unlimited';
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
        class="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between p-5 border-b border-gray-100"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full bg-[#FF8C4B]/10 flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-[#FF8C4B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900 capitalize">
                {{ pluginName }} Details
              </h2>
              <p
                v-if="activation?.platformUsername"
                class="text-xs text-gray-500"
              >
                Connected as @{{ activation.platformUsername }}
              </p>
            </div>
          </div>
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
          <!-- Plugin Summary Overview -->
          <div
            class="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs"
          >
            <div>
              <span class="text-gray-400 block mb-0.5">Status</span>
              <span class="font-semibold text-gray-800 capitalize">{{
                status
              }}</span>
            </div>
            <div>
              <span class="text-gray-400 block mb-0.5"
                >Monitored Channels</span
              >
              <span class="font-semibold text-gray-800"
                >{{ activation?.chats?.length ?? configChats.length }} chats</span
              >
            </div>
          </div>

          <!-- Monitored Chat Configurations & Worker States -->
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-3">
              Monitored Chat Details
            </h3>

            <div
              v-if="activation?.chats && activation.chats.length > 0"
              class="space-y-2.5"
            >
              <div
                v-for="c in activation.chats"
                :key="c.chatId"
                class="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-sm text-gray-900">{{
                    c.name || c.chatId
                  }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium"
                  >
                    Limit: {{ getChatLimit(c.chatId) }}
                  </span>
                </div>

                <div
                  class="flex items-center justify-between text-xs pt-1 border-t border-gray-100"
                >
                  <!-- Stream Status -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-gray-400">Stream:</span>
                    <span
                      v-if="c.worker?.stream === 'LISTENING'"
                      class="inline-flex items-center gap-1 text-emerald-700 font-medium"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                      />
                      Listening (Live)
                    </span>
                    <span v-else class="text-gray-400 font-medium">Stopped</span>
                  </div>

                  <!-- Backfill Status -->
                  <div class="flex items-center gap-1.5">
                    <span class="text-gray-400">Backfill:</span>
                    <span
                      v-if="c.worker?.backfill === 'RUNNING'"
                      class="inline-flex items-center gap-1 text-amber-600 font-medium"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                      />
                      Running ({{ c.worker?.backfillProgress?.inserted ?? 0 }}
                      msgs)
                    </span>
                    <span
                      v-else-if="c.worker?.backfill === 'COMPLETED'"
                      class="text-green-600 font-medium"
                    >
                      Completed
                    </span>
                    <span v-else class="text-gray-400 font-medium">Idle</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fallback if only config chats exist -->
            <div
              v-else-if="configChats.length > 0"
              class="space-y-2"
            >
              <div
                v-for="c in configChats"
                :key="c.id"
                class="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white text-xs"
              >
                <span class="font-medium text-gray-800">{{ c.name }}</span>
                <span class="text-gray-500"
                  >Limit:
                  {{
                    c.historyLimit != null ? `${c.historyLimit} msgs` : 'Unlimited'
                  }}</span
                >
              </div>
            </div>

            <p v-else class="text-xs text-gray-400 py-4 text-center">
              No chats configured for monitoring.
            </p>
          </div>

          <!-- Close Action -->
          <div class="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
