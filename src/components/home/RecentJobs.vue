<script setup lang="ts">
import type { Job } from "../../api/jobs";
import JobCard from "./JobCard.vue";

defineProps<{ jobs: Job[] }>();
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Running Jobs</h2>
      <router-link
        to="/jobs"
        class="text-sm text-[#FF8C4B] hover:text-[#F27D3A] font-medium transition-colors"
      >
        View all
      </router-link>
    </div>
    <div v-if="jobs.length" class="flex flex-col gap-2.5">
      <JobCard v-for="job in jobs" :key="job.id" :job="job" />
    </div>
    <div v-else class="text-center py-8">
      <svg class="w-10 h-10 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-sm text-gray-500 mt-2">No running jobs</p>
      <p class="text-xs text-gray-400 mt-1">Running jobs will appear here</p>
    </div>
  </div>
</template>
