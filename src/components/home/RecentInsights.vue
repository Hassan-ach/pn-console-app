<script setup lang="ts">
import type { InsightSummary, InsightType } from "../../api/insights-api";
import { STATUS_LABELS, STATUS_COLORS } from "../../api/insights-api";

defineProps<{ insights: InsightSummary[] }>();

const TYPE_META: Record<InsightType, { label: string; bg: string; text: string }> = {
  TASK: { label: "Task", bg: "bg-emerald-50", text: "text-emerald-700" },
  URGENCY: { label: "Urgent", bg: "bg-orange-50", text: "text-orange-700" },
  INFO: { label: "Info", bg: "bg-indigo-50", text: "text-indigo-700" },
  DECISION: { label: "Decision", bg: "bg-red-50", text: "text-red-700" },
};
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Latest Insights</h2>
      <a
        href="#insights"
        class="text-sm text-[#FF8C4B] hover:text-[#F27D3A] font-medium transition-colors"
      >
        View all
      </a>
    </div>
    <div v-if="insights.length" class="space-y-3">
      <div
        v-for="insight in insights"
        :key="insight.id"
        class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span
            :class="[TYPE_META[insight.type]?.bg, TYPE_META[insight.type]?.text]"
            class="px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0"
          >
            {{ TYPE_META[insight.type]?.label }}
          </span>
          <p class="text-sm text-gray-700 truncate">{{ insight.content }}</p>
        </div>
        <span
          :class="STATUS_COLORS[insight.status]"
          class="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-3"
        >
          {{ STATUS_LABELS[insight.status] }}
        </span>
      </div>
    </div>
    <div v-else class="text-center py-8 bg-white rounded-xl border border-gray-200">
      <svg class="w-10 h-10 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <p class="text-sm text-gray-500 mt-2">No insights yet</p>
      <p class="text-xs text-gray-400 mt-1">Insights will appear here when data is processed</p>
    </div>
  </div>
</template>
