<script setup lang="ts">
import { computed } from 'vue';
import type { InsightSummary, InsightType } from '../api/insights-api';
import { STATUS_LABELS, STATUS_COLORS } from '../api/insights-api';

const props = defineProps<{
  insight: InsightSummary;
  active?: boolean;
}>();

defineEmits<{
  select: [id: string];
}>();

const TYPE_META: Record<
  InsightType,
  { label: string; rail: string; badge: string }
> = {
  TASK: {
    label: 'Task',
    rail: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  URGENCY: {
    label: 'Urgent',
    rail: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-700',
  },
  INFO: {
    label: 'Info',
    rail: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700',
  },
  DECISION: {
    label: 'Decision',
    rail: 'bg-red-500',
    badge: 'bg-red-50 text-red-700',
  },
};

const meta = computed(() => TYPE_META[props.insight.type]);
const statusLabel = computed(() => STATUS_LABELS[props.insight.status]);
const statusColor = computed(() => STATUS_COLORS[props.insight.status]);

const preview = computed(() => {
  const text = props.insight.content.trim();
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
});
</script>

<template>
  <button
    type="button"
    class="flex w-full items-stretch overflow-hidden rounded-xl border bg-white text-left transition-all duration-150 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 active:scale-[0.997]"
    :class="active
      ? 'border-orange-300 shadow-md shadow-orange-100'
      : 'border-stone-200 hover:border-stone-300'"
    @click="$emit('select', insight.id)"
  >
    <span class="w-[3px] flex-shrink-0" :class="meta.rail" aria-hidden="true" />
    <span class="flex min-w-0 flex-1 flex-col gap-1.5 px-3 py-3.5">
      <span class="flex items-center gap-2">
        <span
          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
          :class="meta.badge"
        >
          {{ meta.label }}
        </span>
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
          :class="statusColor"
        >
          {{ statusLabel }}
        </span>
      </span>
      <span class="text-[14.5px] leading-relaxed text-stone-800">{{ preview }}</span>
    </span>
    <svg
      class="mr-3.5 flex-shrink-0 self-center text-stone-400"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>
