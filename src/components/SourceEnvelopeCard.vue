<script setup lang="ts">
import type { SourceEnvelope } from '../api/insights-api';

defineProps<{
  envelope: SourceEnvelope;
}>();
</script>

<template>
  <div class="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-3">
    <div class="flex items-center gap-2 text-[12px]">
      <span class="inline-flex items-center rounded-full bg-stone-200 px-2 py-0.5 font-medium text-stone-600">
        {{ envelope.sourcePlugin }}
      </span>
      <span class="text-stone-400">{{ new Date(envelope.occurredAt).toLocaleString() }}</span>
    </div>
    <p class="mt-2 text-[13.5px] leading-relaxed text-stone-700">{{ envelope.content }}</p>
  </div>
</template>
