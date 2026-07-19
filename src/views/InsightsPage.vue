<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import InsightItem from '../components/InsightItem.vue';
import { insightsApi, INSIGHT_TYPES, type InsightSummary, type InsightType } from '../api/insights-api';

type TabValue = InsightType | 'ALL';

const TAB_LABELS: Record<TabValue, string> = {
  ALL: 'All',
  TASK: 'Tasks',
  URGENCY: 'Urgent',
  INFO: 'Info',
  DECISION: 'Decisions',
};

const tabs: TabValue[] = ['ALL', ...INSIGHT_TYPES];

const router = useRouter();

const activeTab = ref<TabValue>('ALL');
const insights = ref<InsightSummary[]>([]);
const isLoading = ref(false);
const loadError = ref<string | null>(null);

async function loadInsights() {
  isLoading.value = true;
  loadError.value = null;
  try {
    const type = activeTab.value === 'ALL' ? undefined : activeTab.value;
    insights.value = await insightsApi.list(type);
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Could not load insights.';
  } finally {
    isLoading.value = false;
  }
}

function goToInsight(id: string) {
  router.push({ name: 'insight-detail', params: { id } });
}

watch(activeTab, loadInsights);

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

    <nav class="mb-5 flex gap-0 border-b border-stone-200" role="tablist" aria-label="Filter insights by type">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        role="tab"
        class="mr-5 flex items-center gap-1.5 border-b-2 border-transparent py-2.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        :class="activeTab === tab ? 'border-orange-600 font-semibold text-stone-900' : ''"
        :aria-selected="activeTab === tab"
        @click="activeTab = tab"
      >
        {{ TAB_LABELS[tab] }}
      </button>
    </nav>

    <section class="flex flex-col gap-2.5">
      <div
        v-if="isLoading"
        class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500"
      >
        Loading insights…
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
        <p>Nothing here yet.</p>
        <p class="mt-1 text-[13px]">
          New {{ activeTab === 'ALL' ? '' : TAB_LABELS[activeTab].toLowerCase() + ' ' }}insights will show up as they come in.
        </p>
      </div>

      <ul v-else class="flex flex-col gap-2.5">
        <li v-for="insight in insights" :key="insight.id">
          <InsightItem :insight="insight" @select="goToInsight" />
        </li>
      </ul>
    </section>
  </div>
</template>
