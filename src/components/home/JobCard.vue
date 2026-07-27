<script setup lang="ts">
import type { Job } from "../../api/jobs";

defineProps<{ job: Job }>();

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-gray-100", text: "text-gray-700", label: "Pending" },
  RUNNING: { bg: "bg-blue-50", text: "text-blue-700", label: "Running" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Completed" },
  FAILED: { bg: "bg-red-50", text: "text-red-700", label: "Failed" },
};
</script>

<template>
  <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-gray-900 truncate">{{ job.title }}</h3>
        <span
          :class="[statusConfig[job.status]?.bg, statusConfig[job.status]?.text]"
          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
        >
          <svg v-if="job.status === 'RUNNING'" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ statusConfig[job.status]?.label }}
        </span>
      </div>
      <p class="text-xs text-gray-500 mt-1 truncate">{{ job.message }}</p>
      <div v-if="job.progressable && job.progress !== null" class="mt-2">
        <div class="w-full bg-gray-100 rounded-full h-1.5">
          <div
            class="bg-[#FF8C4B] h-1.5 rounded-full transition-all duration-300"
            :style="{ width: `${job.progress}%` }"
          ></div>
        </div>
        <p class="text-xs text-gray-400 mt-1">{{ job.progress }}%</p>
      </div>
    </div>
    <div class="ml-4 text-xs text-gray-400 whitespace-nowrap">
      {{ timeAgo(job.startedAt) }}
    </div>
  </div>
</template>
