<script setup lang="ts">
import { computed } from 'vue';
import type { ActivationMetrics } from '../../api/plugin-manager';

const props = defineProps<{
  activation: ActivationMetrics;
  backfillChatId?: string;
}>();

const streamUptimeFormatted = computed(() => {
  if (!props.activation.streamUptime) return null;
  const totalSeconds = Math.floor(props.activation.streamUptime / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

const backfillPercent = computed(() => {
  const p = props.activation.backfillProgress;
  if (!p || p.total === 0) return null;
  return Math.round((p.done / p.total) * 100);
});
</script>

<template>
  <div class="space-y-3">
    <div v-if="backfillPercent !== null" class="space-y-1">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>Backfill{{ backfillChatId ? ` (${backfillChatId})` : '' }}</span>
        <span>{{ backfillPercent }}%</span>
      </div>
      <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-[#FF8C4B] rounded-full transition-all duration-500"
          :style="{ width: backfillPercent + '%' }"
        />
      </div>
    </div>

    <div class="flex items-center gap-4 text-sm text-gray-600">
      <span v-if="streamUptimeFormatted" class="inline-flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-green-500" />
        Live {{ streamUptimeFormatted }}
      </span>
      <span>{{ activation.batchCount }} batches</span>
      <span>{{ activation.messageCount }} messages</span>
    </div>

    <p class="text-xs text-gray-400">
      Monitoring {{ activation.chatCount }} chat{{ activation.chatCount !== 1 ? 's' : '' }}
    </p>
  </div>
</template>
