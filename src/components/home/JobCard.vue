<script setup lang="ts">
import type { Job } from "../../api/jobs";

defineProps<{ job: Job }>();

const STATUS_CONFIG: Record<string, { rail: string; badge: string; label: string }> = {
  PENDING: { rail: "bg-stone-400", badge: "bg-stone-50 text-stone-700", label: "Pending" },
  RUNNING: { rail: "bg-blue-500", badge: "bg-blue-50 text-blue-700", label: "Running" },
  COMPLETED: { rail: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", label: "Completed" },
  FAILED: { rail: "bg-red-500", badge: "bg-red-50 text-red-700", label: "Failed" },
};

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
</script>

<template>
  <div class="flex w-full items-stretch overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-150 hover:border-stone-300 hover:shadow-md active:scale-[0.997]">
    <button
      type="button"
      class="flex min-w-0 flex-1 items-stretch text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
    >
      <span class="w-[3px] flex-shrink-0" :class="STATUS_CONFIG[job.status]?.rail" aria-hidden="true" />
      <span class="flex min-w-0 flex-1 flex-col gap-1.5 px-3 py-3.5">
        <span class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide" :class="STATUS_CONFIG[job.status]?.badge">
            <svg v-if="job.status === 'RUNNING'" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ STATUS_CONFIG[job.status]?.label }}
          </span>
        </span>
        <span class="text-[14.5px] leading-relaxed text-stone-800">{{ job.title }}</span>
        <span v-if="job.message" class="text-[12px] text-stone-500">{{ job.message }}</span>
        <div v-if="job.progressable && job.progress !== null" class="mt-0.5">
          <div class="w-full bg-stone-100 rounded-full h-1.5">
            <div
              class="bg-[#FF8C4B] h-1.5 rounded-full transition-all duration-300"
              :style="{ width: `${job.progress}%` }"
            ></div>
          </div>
          <span class="text-[11px] text-stone-400 mt-0.5 inline-block">{{ job.progress }}%</span>
        </div>
      </span>
    </button>
    <span class="mr-3.5 flex flex-shrink-0 items-center text-[12px] text-stone-400 whitespace-nowrap">
      {{ timeAgo(job.startedAt) }}
    </span>
  </div>
</template>
