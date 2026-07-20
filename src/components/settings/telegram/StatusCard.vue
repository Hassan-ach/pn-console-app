<script setup lang="ts">
defineProps<{
  connected: boolean;
  phone?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  connect: [];
}>();
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-[#FF8C4B]/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-[#FF8C4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">Telegram</h3>
          <p v-if="loading" class="text-sm text-gray-400">Checking status...</p>
          <template v-else-if="connected">
            <p class="text-sm text-green-600 font-medium">Connected</p>
            <p v-if="phone" class="text-sm text-gray-500">{{ phone }}</p>
          </template>
          <p v-else class="text-sm text-gray-500">Not connected</p>
        </div>
      </div>
      <div>
        <span
          v-if="loading"
          class="inline-block w-3 h-3 rounded-full bg-gray-300 animate-pulse"
        ></span>
        <span
          v-else-if="connected"
          class="inline-block w-3 h-3 rounded-full bg-green-500"
        ></span>
        <button
          v-else
          @click="emit('connect')"
          class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] transition-colors"
        >
          Connect
        </button>
      </div>
    </div>
  </div>
</template>
