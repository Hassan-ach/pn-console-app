<script setup lang="ts">
import type { ActivationMetrics } from '../api/plugin-manager';

defineProps<{
  name: string;
  connected: boolean;
  phone?: string;
  loading?: boolean;
  connectHref?: string;
  status: 'NOT_CONNECTED' | 'CONNECTED' | 'CONFIGURED' | 'ACTIVATING' | 'ACTIVE' | 'DEACTIVATING' | 'ERROR';
  chats?: { name: string; id: string }[];
  activation?: ActivationMetrics | null;
  errorMessage?: string;
  selected?: boolean;
  selectable?: boolean;
  limit?: number;
}>();

const emit = defineEmits<{
  connect: [];
  select: [];
  'update:limit': [value: number];
  activate: [];
  deactivate: [];
  'configure-chats': [];
  disconnect: [];
}>();
</script>

<template>
  <div
    class="rounded-lg border p-5 transition-colors"
    :class="[
      selected ? 'border-[#FF8C4B] bg-[#FF8C4B]/5' : 'border-gray-200 bg-white',
      connected && selectable ? 'cursor-pointer' : ''
    ]"
    @click="connected && selectable && emit('select')"
  >
    <div v-if="selected" class="flex items-center gap-4 mb-3 pb-3 border-b border-gray-100">
      <button
        type="button"
        @click.stop="emit('update:limit', limit === -1 ? 20 : -1)"
        class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-pointer"
        :class="limit === -1 ? 'bg-[#FF8C4B] text-white border-[#FF8C4B]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF8C4B]/50'"
      >
        <svg v-if="limit === -1" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <span>All messages</span>
      </button>
      <div v-if="limit !== -1" class="flex items-center gap-1.5">
        <label class="text-xs text-gray-500 flex items-center gap-1">
          Limit
          <span class="relative group">
            <span class="inline-block w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[10px] text-center leading-3.5 cursor-default font-bold">?</span>
            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
              How many recent messages to import
            </span>
          </span>
        </label>
        <input
          :value="limit"
          @input="(e: any) => emit('update:limit', Number(e.target.value))"
          type="number"
          min="1"
          class="border border-gray-300 rounded px-2 py-1 text-xs w-20 no-spinner"
          @click.stop
        />
      </div>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#FF8C4B]/10 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-[#FF8C4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 capitalize">{{ name }}</h3>
          <p v-if="loading" class="text-sm text-gray-400">Checking status...</p>
          <template v-else-if="connected">
            <p class="text-sm text-green-600 font-medium">Connected</p>
            <p v-if="phone" class="text-sm text-gray-500">{{ phone }}</p>
          </template>
          <p v-else class="text-sm text-gray-500">Not connected</p>
          <div v-if="chats && chats.length" class="flex flex-wrap gap-1.5 mt-1.5">
            <span
              v-for="chat in chats"
              :key="chat.id"
              class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
            >
              {{ chat.name || chat.id }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span
          v-if="status === 'ACTIVATING' || status === 'DEACTIVATING'"
          class="inline-block w-3 h-3 rounded-full bg-yellow-400 animate-pulse"
        />
        <span
          v-else-if="status === 'ACTIVE'"
          class="inline-block w-3 h-3 rounded-full bg-green-500"
        />
        <span
          v-else-if="status === 'ERROR'"
          class="inline-block w-3 h-3 rounded-full bg-red-500"
        />
        <span
          v-else-if="status === 'CONFIGURED'"
          class="inline-block w-3 h-3 rounded-full bg-gray-400"
        />
        <span
          v-else-if="status === 'CONNECTED'"
          class="inline-block w-3 h-3 rounded-full bg-blue-400"
        />
        <span
          v-else
          class="inline-block w-3 h-3 rounded-full bg-gray-300"
        />
        <p v-if="errorMessage && status === 'ERROR'" class="text-xs text-red-600 max-w-40 truncate" :title="errorMessage">
          {{ errorMessage }}
        </p>
      </div>
    </div>
    <div v-if="status !== 'ACTIVATING' && status !== 'DEACTIVATING'" class="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
      <button
        v-if="status === 'NOT_CONNECTED'"
        type="button"
        :disabled="!connectHref && loading"
        class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] transition-colors cursor-pointer disabled:opacity-50"
        @click.stop="emit('connect')"
      >
        Connect
      </button>

      <button
        v-if="status === 'CONNECTED' || status === 'CONFIGURED'"
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] transition-colors cursor-pointer"
        @click.stop="emit('configure-chats')"
      >
        Configure Chats
      </button>

      <button
        v-if="status === 'CONFIGURED'"
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
        @click.stop="emit('activate')"
      >
        Activate
      </button>

      <button
        v-if="status === 'ERROR'"
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] transition-colors cursor-pointer"
        @click.stop="emit('activate')"
      >
        Retry
      </button>

      <button
        v-if="status === 'ACTIVE'"
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
        @click.stop="emit('deactivate')"
      >
        Deactivate
      </button>

      <button
        v-if="status !== 'NOT_CONNECTED'"
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        :class="{ 'opacity-50 cursor-not-allowed': status === 'ACTIVE' }"
        :disabled="status === 'ACTIVE'"
        @click.stop="emit('disconnect')"
      >
        Disconnect
      </button>
    </div>
    <div v-else class="flex items-center justify-center mt-4 pt-3 border-t border-gray-100">
      <span class="inline-flex items-center gap-2 text-sm text-yellow-600">
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ status === 'ACTIVATING' ? 'Activating...' : 'Deactivating...' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner[type='number'] {
  -moz-appearance: textfield;
}
</style>
