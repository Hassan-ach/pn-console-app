<script setup lang="ts">
defineProps<{
  name: string;
  connected: boolean;
  phone?: string;
  loading?: boolean;
  connectHref?: string;
  selected?: boolean;
  selectable?: boolean;
  limit?: number;
}>();

const emit = defineEmits<{
  connect: [];
  select: [];
  'update:limit': [value: number];
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
        </div>
      </div>
      <div class="shrink-0">
        <span
          v-if="loading"
          class="inline-block w-3 h-3 rounded-full bg-gray-300 animate-pulse"
        />
        <span
          v-else-if="connected"
          class="inline-block w-3 h-3 rounded-full bg-green-500"
        />
        <a
          v-else-if="connectHref"
          :href="connectHref"
          class="inline-block px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] transition-colors"
        >
          Connect
        </a>
        <button
          v-else
          @click="emit('connect')"
          class="inline-block px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] transition-colors"
        >
          Connect
        </button>
      </div>
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
