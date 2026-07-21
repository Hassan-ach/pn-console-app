<script setup lang="ts">
import { timeAgo } from '../../utils/plugin';

defineProps<{
  loading: boolean;
  result: { inserted: number; envelopes: number } | null;
  error: string;
  lastSynced: number | null;
}>();
const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div v-if="loading" class="mt-1 ml-1 text-xs text-gray-400">Backfilling...</div>
  <div v-else-if="result" class="mt-1 ml-1 flex items-center gap-2">
    <span class="text-xs text-green-600">
      Inserted {{ result.inserted }} — {{ result.envelopes }} total envelopes
    </span>
    <span v-if="lastSynced" class="text-[10px] text-gray-400">
      synced {{ timeAgo(lastSynced) }}
    </span>
  </div>
  <div v-else-if="error" class="mt-1 ml-1 flex items-center gap-2">
    <span class="text-xs text-red-600">{{ error }}</span>
    <button
      @click="emit('retry')"
      class="text-xs text-[#FF8C4B] hover:underline disabled:text-gray-300 disabled:no-underline"
    >
      Retry
    </button>
  </div>
</template>
