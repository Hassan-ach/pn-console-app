<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { jobsApi, type Job, type JobStatus } from "../api/jobs";
import JobCard from "../components/home/JobCard.vue";

const jobs = ref<Job[]>([]);
const loading = ref(true);
const activeTab = ref<JobStatus | "ALL">("ALL");
let pollingInterval: ReturnType<typeof setInterval> | null = null;

const tabs: { label: string; value: JobStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Running", value: "RUNNING" },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Failed", value: "FAILED" },
];

async function fetchJobs() {
  loading.value = true;
  try {
    jobs.value = await jobsApi.list(activeTab.value === "ALL" ? undefined : activeTab.value);
  } catch {
    jobs.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchJobs();
  pollingInterval = setInterval(fetchJobs, 3000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

watch(activeTab, fetchJobs);
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Jobs</h1>

    <div class="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="
          activeTab === tab.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        class="px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-2 border-[#FF8C4B] border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="jobs.length" class="space-y-3">
      <JobCard v-for="job in jobs" :key="job.id" :job="job" />
    </div>

    <div v-else class="text-center py-16 bg-white rounded-xl border border-gray-200">
      <svg class="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-sm text-gray-500 mt-3">No {{ activeTab === 'ALL' ? '' : activeTab.toLowerCase() }} jobs found</p>
    </div>
  </div>
</template>
