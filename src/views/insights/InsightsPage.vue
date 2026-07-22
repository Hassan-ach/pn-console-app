<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import InsightItem from '../../components/insights/InsightItem.vue';
import {
  insightsApi,
  INSIGHT_TYPES,
  VALID_ACTIONS,
  type InsightSummary,
  type InsightType,
  type InsightActionStatus,
} from '../../api/insights-api';

type MainTab = 'OVERVIEW' | InsightType;

const MAIN_TAB_LABELS: Record<MainTab, string> = {
  OVERVIEW: 'Overview',
  TASK: 'Tasks',
  URGENCY: 'Urgent',
  INFO: 'Info',
  DECISION: 'Decisions',
};

const STATUS_LABELS_SHORT: Record<InsightActionStatus, string> = {
  PENDING: 'Pending',
  NOTED: 'Noted',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  IN_REVIEW: 'In Review',
  DECIDED: 'Decided',
  DELEGATED: 'Delegated',
  DELAYED: 'Delayed',
  HIDDEN: 'Hidden',
};

const mainTabs: MainTab[] = ['OVERVIEW', ...INSIGHT_TYPES];

const router = useRouter();

const activeMainTab = ref<MainTab>('OVERVIEW');
const activeStatus = ref<InsightActionStatus | 'ALL'>('ALL');
const insights = ref<InsightSummary[]>([]);
const isLoading = ref(false);
const loadError = ref<string | null>(null);

const subTabs = computed(() => {
  if (activeMainTab.value === 'OVERVIEW') return [];
  return VALID_ACTIONS[activeMainTab.value] ?? [];
});

async function loadInsights() {
  isLoading.value = true;
  loadError.value = null;
  try {
    const type = activeMainTab.value === 'OVERVIEW' ? undefined : activeMainTab.value;
    const status = activeStatus.value === 'ALL' ? undefined : activeStatus.value;
    const limit = activeMainTab.value === 'OVERVIEW' ? 5 : undefined;
    insights.value = await insightsApi.list(type, status, limit);
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Could not load insights.';
  } finally {
    isLoading.value = false;
  }
}

function goToInsight(id: string) {
  router.push({ name: 'insight-detail', params: { id } });
}

function selectMainTab(tab: MainTab) {
  activeMainTab.value = tab;
  activeStatus.value = 'ALL';
}

function selectStatus(status: InsightActionStatus | 'ALL') {
  activeStatus.value = status;
}

function handleStatusChange(id: string, newStatus: InsightActionStatus) {
  const idx = insights.value.findIndex((i) => i.id === id);
  if (idx === -1) return;

  const prev = insights.value[idx].status;
  const removed = insights.value[idx];
  insights.value[idx] = { ...removed, status: newStatus };

  if (activeStatus.value !== 'ALL' && newStatus !== activeStatus.value) {
    insights.value.splice(idx, 1);
  }

  insightsApi.setAction(id, newStatus).catch(() => {
    if (activeStatus.value !== 'ALL' && newStatus !== activeStatus.value) {
      insights.value.splice(idx, 0, { ...removed, status: prev });
    } else {
      insights.value[idx] = { ...insights.value[idx], status: prev };
    }
  });
}

watch([activeMainTab, activeStatus], loadInsights);

onMounted(loadInsights);
</script>

<template>
  <div class="mx-auto w-full bg-[#faf9f6] px-6 pb-16 pt-10 font-sans text-stone-900">
    <header class="mb-7">
      <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        Insights
      </p>
      <h1 class="text-[26px] font-semibold tracking-tight">What's moving today</h1>
    </header>

    <!-- Main Tabs -->
    <nav class="mb-1 flex gap-0 border-b border-stone-200" role="tablist" aria-label="Filter insights by type">
      <button
        v-for="tab in mainTabs"
        :key="tab"
        type="button"
        role="tab"
        class="mr-5 flex items-center gap-1.5 border-b-2 border-transparent py-2.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        :class="activeMainTab === tab ? 'border-orange-600 font-semibold text-stone-900' : ''"
        :aria-selected="activeMainTab === tab"
        @click="selectMainTab(tab)"
      >
        {{ MAIN_TAB_LABELS[tab] }}
      </button>
    </nav>

    <!-- Sub Tabs (Status Filters) -->
    <nav
      v-if="subTabs.length > 0"
      class="mb-4 flex gap-0 border-b border-stone-100"
      role="tablist"
      :aria-label="`Filter ${MAIN_TAB_LABELS[activeMainTab]} by status`"
    >
      <button
        type="button"
        role="tab"
        class="mr-3 border-b border-transparent py-2 text-[13px] font-medium text-stone-400 transition-colors hover:text-stone-700"
        :class="activeStatus === 'ALL' ? 'border-stone-900 font-semibold text-stone-900' : ''"
        :aria-selected="activeStatus === 'ALL'"
        @click="selectStatus('ALL')"
      >
        All
      </button>
      <button
        v-for="status in subTabs"
        :key="status"
        type="button"
        role="tab"
        class="mr-3 border-b border-transparent py-2 text-[13px] font-medium text-stone-400 transition-colors hover:text-stone-700"
        :class="activeStatus === status ? 'border-stone-900 font-semibold text-stone-900' : ''"
        :aria-selected="activeStatus === status"
        @click="selectStatus(status)"
      >
        {{ STATUS_LABELS_SHORT[status] }}
      </button>
    </nav>

    <section class="flex flex-col gap-2.5">
      <div
        v-if="isLoading"
        class="flex flex-col gap-2.5"
      >
        <div v-for="i in 3" :key="i" class="flex w-full items-stretch overflow-hidden rounded-xl border border-stone-200 bg-white">
          <span class="w-[3px] flex-shrink-0 bg-stone-200 animate-pulse" />
          <span class="flex min-w-0 flex-1 flex-col gap-2 px-3 py-4">
            <span class="flex gap-2">
              <span class="h-5 w-16 rounded-full bg-stone-100 animate-pulse" />
              <span class="h-5 w-14 rounded-full bg-stone-100 animate-pulse" />
            </span>
            <span class="h-4 w-3/4 rounded bg-stone-100 animate-pulse" />
          </span>
        </div>
      </div>

      <div
        v-else-if="loadError"
        class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm"
      >
        <p class="mb-2.5 text-red-700">{{ loadError }}</p>
        <button
          type="button"
          class="rounded-lg bg-orange-50 px-3.5 py-1.5 text-[13px] font-semibold text-orange-700 hover:brightness-95"
          @click="loadInsights"
        >
          Try again
        </button>
      </div>

      <div
        v-else-if="insights.length === 0"
        class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500"
      >
        <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-stone-400">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p>Nothing here yet.</p>
        <p class="mt-1 text-[13px]">
          New {{ activeMainTab === 'OVERVIEW' ? '' : MAIN_TAB_LABELS[activeMainTab].toLowerCase() + ' ' }}insights will show up as they come in.
        </p>
      </div>

      <ul v-else class="flex flex-col gap-2.5">
        <li v-for="insight in insights" :key="insight.id">
          <InsightItem :insight="insight" @select="goToInsight" @status-change="handleStatusChange" />
        </li>
      </ul>
    </section>
  </div>
</template>
