<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { PluginManagerClient, type PluginInfo } from "../api/plugin-manager";
import { insightsApi, type InsightSummary } from "../api/insights-api";
import { jobsApi, type Job } from "../api/jobs";
import SummaryCards from "../components/home/SummaryCards.vue";
import RecentJobs from "../components/home/RecentJobs.vue";
import RecentInsights from "../components/home/RecentInsights.vue";

const pluginManager = new PluginManagerClient();

const dataSources = ref<{ connected: number; total: number }>({ connected: 0, total: 0 });
const insightsCount = ref(0);
const recentInsights = ref<InsightSummary[]>([]);
const activeJobsCount = ref(0);
const recentJobs = ref<Job[]>([]);
const loading = ref(true);
let pollingInterval: ReturnType<typeof setInterval> | null = null;

async function fetchData() {
  try {
    const [plugins, insights, jobs] = await Promise.all([
      pluginManager.list().catch(() => [] as PluginInfo[]),
      insightsApi.list(undefined, undefined, 100).catch(() => [] as InsightSummary[]),
      jobsApi.list("RUNNING").catch(() => [] as Job[]),
    ]);

    dataSources.value = {
      connected: plugins.filter((p) => p.connected).length,
      total: plugins.length,
    };
    insightsCount.value = insights.length;
    recentInsights.value = insights.slice(0, 5);
    recentJobs.value = jobs.slice(0, 5);
    activeJobsCount.value = jobs.length;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
  pollingInterval = setInterval(fetchData, 3000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-2 border-[#FF8C4B] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div v-else class="space-y-6">
      <SummaryCards
        :data-sources="dataSources"
        :insights="insightsCount"
        :active-jobs="activeJobsCount"
      />
      <RecentJobs :jobs="recentJobs" />
      <RecentInsights :insights="recentInsights" />
    </div>
  </div>
</template>
