<script setup lang="ts">
import { computed } from 'vue';
import type { InsightSummary, InsightType, InsightActionStatus } from '../../api/insights-api';
import { STATUS_LABELS, STATUS_COLORS, VALID_ACTIONS, getPriorityColor, formatDeadline } from '../../api/insights-api';

const props = defineProps<{
  insight: InsightSummary;
  active?: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  'status-change': [id: string, status: InsightActionStatus];
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
const statusColor = computed(() => STATUS_COLORS[props.insight.status]);

const availableStatuses = computed(() => VALID_ACTIONS[props.insight.type] ?? []);

const preview = computed(() => {
  const text = props.insight.content.trim();
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
});

const priorityColor = computed(() => getPriorityColor(props.insight.priority));

const deadlineText = computed(() => {
  if (props.insight.status !== 'PENDING') return null;
  return formatDeadline(props.insight.deadline);
});

function onStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newStatus = target.value as InsightActionStatus;
  if (newStatus !== props.insight.status) {
    emit('status-change', props.insight.id, newStatus);
  }
}
</script>

<template>
  <div
    class="flex w-full items-stretch overflow-hidden rounded-xl border bg-white transition-all duration-150 hover:shadow-md active:scale-[0.997]"
    :class="active
      ? 'border-orange-300 shadow-md shadow-orange-100'
      : 'border-stone-200 hover:border-stone-300'"
  >
    <button
      type="button"
      class="flex min-w-0 flex-1 items-stretch text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
      @click="emit('select', insight.id)"
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
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            :class="priorityColor"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            {{ insight.priority ?? 0 }}/10
          </span>
        </span>
        <span class="text-[14.5px] leading-relaxed text-stone-800">{{ preview }}</span>
        <span
          v-if="deadlineText"
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {{ deadlineText }}
        </span>
      </span>
    </button>
    <span class="mr-2 flex flex-shrink-0 items-center">
      <span
        class="relative inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
        :class="statusColor"
      >
        <select
          :value="insight.status"
          class="appearance-none bg-transparent pl-0 pr-3 py-0 text-[11px] font-medium text-inherit cursor-pointer focus:outline-none"
          @click.stop
          @change="onStatusChange"
        >
          <option v-for="s in availableStatuses" :key="s" :value="s">
            {{ STATUS_LABELS[s] }}
          </option>
        </select>
        <svg class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" width="8" height="8" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </span>
    <button
      type="button"
      class="mr-3.5 flex flex-shrink-0 items-center text-stone-400 focus-visible:outline-none"
      @click="emit('select', insight.id)"
    >
      <svg
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
  </div>
</template>
