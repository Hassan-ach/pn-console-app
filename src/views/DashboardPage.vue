<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  insightsApi,
  type InsightSummary,
  type InsightType,
  formatDeadline,
  getPriorityColor,
  STATUS_LABELS,
} from "../api/insights-api";

const router = useRouter();

const userName = ref("there");
const insights = ref<InsightSummary[]>([]);
const loading = ref(true);
let pollingInterval: ReturnType<typeof setInterval> | null = null;

function getUserName(): string {
  const token = sessionStorage.getItem("access_token");
  if (!token) return "there";
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    if (typeof payload.email === "string") return payload.email.split("@")[0];
    if (typeof payload.sub === "string") return payload.sub;
  } catch {
    // ignore
  }
  return "there";
}

const TYPE_LABELS: Record<InsightType, string> = {
  TASK: "Task",
  URGENCY: "Urgency",
  INFO: "Info",
  DECISION: "Decision",
};

const TYPE_COLORS: Record<InsightType, string> = {
  TASK: "bg-emerald-50 text-emerald-700",
  URGENCY: "bg-orange-50 text-orange-700",
  INFO: "bg-indigo-50 text-indigo-700",
  DECISION: "bg-red-50 text-red-700",
};

const TYPE_BORDER_COLORS: Record<InsightType, string> = {
  TASK: "border-l-emerald-400",
  URGENCY: "border-l-orange-400",
  INFO: "border-l-indigo-400",
  DECISION: "border-l-red-400",
};

const TYPE_ICONS: Record<InsightType, string> = {
  TASK: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  URGENCY: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
  INFO: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  DECISION: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

function perTypeCounts(items: InsightSummary[]): Record<InsightType, number> {
  const counts: Record<InsightType, number> = { TASK: 0, URGENCY: 0, INFO: 0, DECISION: 0 };
  for (const item of items) counts[item.type]++;
  return counts;
}

const typeCounts = computed(() => perTypeCounts(insights.value));

const topPriority = computed(() => {
  const pending = insights.value.filter((i) => i.status === "PENDING");
  if (!pending.length) return null;
  return pending.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
});

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function goToInsight(id: string) {
  router.push({ path: `/insights/${id}`, query: { from: 'home' } });
}

async function fetchData() {
  try {
    userName.value = getUserName();
    const insightList = await insightsApi.list(undefined, undefined, 50).catch(() => [] as InsightSummary[]);
    insights.value = insightList;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
  pollingInterval = setInterval(fetchData, 5000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-2 border-[#FF8C4B] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <template v-else>
      <div class="greeting-row mb-6">
        <div class="greeting">
          <div class="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-1">
            {{ greeting() }}
          </div>
          <h1 class="text-[22px] font-bold text-gray-900">
            {{ userName }}
          </h1>
        </div>
      </div>

      <div class="today-focus py-4 border-b border-gray-200 mb-5">
        <div class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
          Today's Focus
        </div>
        <h2 class="text-[17px] font-semibold text-gray-900">
          What is the most important thing to move today?
        </h2>
      </div>

      <div
        v-if="topPriority"
        class="priority-card bg-white border border-gray-200 border-l-4 border-l-[#FF8C4B] rounded-xl p-4 mb-5 cursor-pointer hover:border-l-[#F27D3A] hover:bg-gray-50 transition-all"
        @click="goToInsight(topPriority.id)"
      >
        <div class="text-[10px] font-bold uppercase tracking-wider text-[#FF8C4B] mb-2">
          Top Priority
        </div>
        <h3 class="text-[15px] font-bold text-gray-900 mb-2">
          {{ topPriority.content }}
        </h3>
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded bg-orange-50 text-orange-700">
            {{ topPriority.type === "URGENCY" ? "Urgent" : topPriority.type.charAt(0) + topPriority.type.slice(1).toLowerCase() }}
          </span>
          <span :class="getPriorityColor(topPriority.priority)" class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded">
            ⚡ {{ topPriority.priority ?? 0 }}/10
          </span>
          <span class="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded bg-stone-100 text-stone-600">
            {{ STATUS_LABELS[topPriority.status] }}
          </span>
        </div>
        <div
          class="deadline-pill inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-0.5 rounded text-[11px] font-semibold"
          :class="topPriority.deadline ? '' : 'bg-stone-100 text-stone-500'"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ topPriority.deadline ? formatDeadline(topPriority.deadline) : 'No deadline set' }}
        </div>
      </div>

      <div
        v-else
        class="bg-white border border-gray-200 border-l-4 border-l-gray-300 rounded-xl p-4 mb-5"
      >
        <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
          Top Priority
        </div>
        <p class="text-[13px] text-gray-400">
          No insights yet. Create your first insight to see it here.
        </p>
      </div>

      <div class="summary-section py-4 border-b border-gray-200 mb-5">
        <div class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">
          Summary
        </div>
        <h2 class="text-[17px] font-semibold text-gray-900">
          Overview of your workspace
        </h2>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Insights</h2>
          <router-link
            to="/insights"
            class="text-sm text-[#FF8C4B] hover:text-[#F27D3A] font-medium transition-colors"
          >
            View all
          </router-link>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="type in (['TASK', 'URGENCY', 'INFO', 'DECISION'] as InsightType[])"
            :key="type"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 border-l-4 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all"
            :class="TYPE_BORDER_COLORS[type]"
            @click="router.push({ path: '/insights', query: { type } })"
          >
            <div :class="TYPE_COLORS[type]" class="p-2 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="TYPE_ICONS[type]" />
              </svg>
            </div>
            <div>
              <p class="text-xl font-bold text-gray-900">{{ typeCounts[type] }}</p>
              <p class="text-xs text-gray-500">{{ TYPE_LABELS[type] }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
