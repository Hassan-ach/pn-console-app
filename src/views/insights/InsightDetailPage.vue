<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  insightsApi,
<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
  VALID_ACTIONS,
  STATUS_LABELS,
  STATUS_COLORS,
=======
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue
  type InsightDetail,
  type InsightSummary,
  type InsightType,
  type InsightActionStatus,
  type SourceEnvelope,
<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
} from '../../api/insights-api';
import SourceEnvelopeCard from '../../components/insights/SourceEnvelopeCard.vue';
=======
  VALID_ACTIONS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '../api/insights-api';
import SourceEnvelopeCard from '../components/SourceEnvelopeCard.vue';
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue

const TYPE_LABELS: Record<InsightType, string> = {
  TASK: 'Task',
  URGENCY: 'Urgent',
  INFO: 'Info',
  DECISION: 'Decision',
};

const TYPE_BADGE: Record<InsightType, string> = {
  TASK: 'bg-emerald-50 text-emerald-700',
  URGENCY: 'bg-orange-50 text-orange-700',
  INFO: 'bg-indigo-50 text-indigo-700',
  DECISION: 'bg-red-50 text-red-700',
};

const route = useRoute();
const router = useRouter();

const detail = ref<InsightDetail | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const showVersions = ref(false);
const versions = ref<InsightSummary[]>([]);
const versionsLoaded = ref(false);
const versionsLoading = ref(false);
const versionsError = ref<string | null>(null);

const otherVersions = computed(() =>
  versions.value.filter((v) => v.version !== detail.value?.version),
);

const expandedVersionId = ref<string | null>(null);
const versionDetails = ref<Record<string, InsightDetail>>({});
const versionDetailLoadingId = ref<string | null>(null);
const versionDetailErrors = ref<Record<string, string>>({});

const showReferences = ref(false);
const sourceEnvelopes = ref<SourceEnvelope[]>([]);
const sourceEnvelopesLoading = ref(false);
const sourceEnvelopesError = ref<string | null>(null);

const actionLoading = ref(false);
const actionError = ref<string | null>(null);

const allowedActions = computed<InsightActionStatus[]>(() => {
  if (!detail.value) return [];
  return VALID_ACTIONS[detail.value.type] ?? [];
});

<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
const availableStatuses = computed(() => {
  if (!detail.value) return [];
  return allowedActions.value.filter((a) => a !== detail.value?.status);
});

const selectedAction = ref<InsightActionStatus | ''>('');

const statusLabel = computed(() => detail.value ? STATUS_LABELS[detail.value.status] : '');
const statusColor = computed(() => detail.value ? STATUS_COLORS[detail.value.status] : '');

async function performAction() {
  if (!detail.value || !selectedAction.value || selectedAction.value === detail.value.status || actionLoading.value) return;
  actionLoading.value = true;
  actionError.value = null;
  try {
    detail.value = await insightsApi.setAction(detail.value.id, selectedAction.value);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to perform action.';
  } finally {
    selectedAction.value = detail.value?.status ?? '';
=======
const statusLabel = computed(() => detail.value ? STATUS_LABELS[detail.value.status] : '');
const statusColor = computed(() => detail.value ? STATUS_COLORS[detail.value.status] : '');

async function performAction(action: InsightActionStatus) {
  if (!detail.value || actionLoading.value) return;
  actionLoading.value = true;
  actionError.value = null;
  try {
    detail.value = await insightsApi.setAction(detail.value.id, action);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to perform action.';
  } finally {
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue
    actionLoading.value = false;
  }
}

<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
function onDetailStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  selectedAction.value = target.value as InsightActionStatus;
  performAction();
}

=======
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue
async function loadSourceEnvelopes() {
  if (!detail.value || !detail.value.latestVersionId) return;
  sourceEnvelopesLoading.value = true;
  sourceEnvelopesError.value = null;
  try {
    const result = await insightsApi.getSourceEnvelopes(
      route.params.id as string,
      detail.value.latestVersionId,
    );
    sourceEnvelopes.value = Array.isArray(result) ? result : [];
  } catch (err) {
    sourceEnvelopesError.value = 'An error occurred while fetching references.';
  } finally {
    sourceEnvelopesLoading.value = false;
  }
}

async function loadDetail(id: string) {
  isLoading.value = true;
  error.value = null;
  detail.value = null;
  try {
    detail.value = await insightsApi.get(id);
    if (detail.value.envolopsRef.length) {
      loadSourceEnvelopes();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not load this insight.';
  } finally {
    isLoading.value = false;
  }
}

async function loadVersions() {
  versionsLoading.value = true;
  versionsError.value = null;
  try {
    versions.value = await insightsApi.listVersions(route.params.id as string);
    versionsLoaded.value = true;
  } catch (err) {
    versionsError.value = err instanceof Error ? err.message : 'Could not load version history.';
  } finally {
    versionsLoading.value = false;
  }
}

function toggleVersions() {
  showVersions.value = !showVersions.value;
  if (showVersions.value && !versionsLoaded.value && !versionsLoading.value) {
    loadVersions();
  }
}

async function toggleVersionDetail(versionId: string) {
  if (expandedVersionId.value === versionId) {
    expandedVersionId.value = null;
    return;
  }
  expandedVersionId.value = versionId;
  if (versionDetails.value[versionId] || versionDetailLoadingId.value === versionId) return;

  versionDetailLoadingId.value = versionId;
  delete versionDetailErrors.value[versionId];
  try {
    versionDetails.value[versionId] = await insightsApi.getVersion(route.params.id as string, versionId);
  } catch (err) {
    versionDetailErrors.value[versionId] = err instanceof Error ? err.message : 'Could not load this version.';
  } finally {
    versionDetailLoadingId.value = null;
  }
}

onMounted(() => loadDetail(route.params.id as string));

watch(
  () => route.params.id,
  (id) => {
    if (typeof id !== 'string') return;
    loadDetail(id);
    showVersions.value = false;
    versions.value = [];
    versionsLoaded.value = false;
    versionsError.value = null;
    expandedVersionId.value = null;
    versionDetails.value = {};
    versionDetailErrors.value = {};
    showReferences.value = false;
    sourceEnvelopes.value = [];
    sourceEnvelopesError.value = null;
    actionError.value = null;
<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
    selectedAction.value = '';
=======
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue
  },
);
</script>

<template>
  <div class="mx-auto w-full bg-[#faf9f6] px-6 pb-16 pt-10 font-sans text-stone-900">
    <button
      type="button"
      class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900"
      @click="router.back()"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      Back to insights
    </button>

    <div v-if="isLoading" class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm text-stone-500">
      Loading insight…
    </div>

    <div v-else-if="error" class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-sm">
      <p class="mb-2.5 text-red-700">{{ error }}</p>
      <button
        type="button"
        class="rounded-lg bg-orange-50 px-3.5 py-1.5 text-[13px] font-semibold text-orange-700 hover:brightness-95"
        @click="loadDetail(route.params.id as string)"
      >
        Try again
      </button>
    </div>

    <article v-else-if="detail" class="rounded-xl border border-stone-200 bg-white p-6">
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
          :class="TYPE_BADGE[detail.type]"
        >
          {{ TYPE_LABELS[detail.type] }}
        </span>
<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
        <span v-if="actionError" class="text-[11px] text-red-600">{{ actionError }}</span>
        <span
          v-if="availableStatuses.length > 0"
          class="relative inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
          :class="statusColor"
        >
          <select
            :value="detail.status"
            :disabled="actionLoading"
            class="appearance-none bg-transparent pl-0 pr-3 py-0 text-[11px] font-medium text-inherit cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            @change="onDetailStatusChange"
          >
            <option :value="detail.status" disabled>
              {{ statusLabel }}
            </option>
            <option v-for="action in availableStatuses" :key="action" :value="action">
              {{ STATUS_LABELS[action] }}
            </option>
          </select>
          <svg class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" width="8" height="8" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
=======
        <span
          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
          :class="statusColor"
        >
          {{ statusLabel }}
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue
        </span>
      </div>

      <p class="mt-4 text-[17px] leading-relaxed">{{ detail.content }}</p>

      <!-- Metadata Badges -->
      <div class="mt-5 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-stone-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-stone-400">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          {{ new Date(detail.createdAt).toLocaleDateString() }}
        </span>
        <span v-if="detail.sourcePlugin" class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-stone-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-stone-400">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {{ detail.sourcePlugin }}
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-stone-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-stone-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {{ detail.broadcasted ? 'Broadcasted' : 'Not broadcasted' }}
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-[12px] font-medium text-stone-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-stone-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
          </svg>
          v{{ detail.version }}
        </span>
        <button
          v-if="detail.envolopsRef.length"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[12px] font-medium text-orange-700 transition-colors hover:bg-orange-100"
          @click="showReferences = !showReferences"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-400">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {{ detail.envolopsRef.length }} ref{{ detail.envolopsRef.length > 1 ? 's' : '' }}
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            class="transition-transform"
            :class="showReferences ? 'rotate-180' : ''"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div v-if="showReferences && detail.envolopsRef.length" class="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-4">
        <div v-if="sourceEnvelopesLoading" class="py-3 text-center text-sm text-stone-500">
          Loading source messages…
        </div>
        <div v-else-if="sourceEnvelopesError" class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-6 text-center text-sm">
          <p class="mb-2.5 text-red-700">{{ sourceEnvelopesError }}</p>
          <button
            type="button"
            class="rounded-lg bg-orange-50 px-3.5 py-1.5 text-[13px] font-semibold text-orange-700 hover:brightness-95"
            @click="loadSourceEnvelopes"
          >
            Try again
          </button>
        </div>
        <template v-else>
          <SourceEnvelopeCard v-for="env in sourceEnvelopes" :key="env.envolopId" :envelope="env" />
          <p v-if="sourceEnvelopes.length === 0" class="py-3 text-center text-sm text-stone-500">
            No refs for this insight.
          </p>
        </template>
      </div>
    </article>

<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
    <!-- Version History -->
=======
    <div v-if="detail && allowedActions.length > 0" class="mt-4 rounded-xl border border-stone-200 bg-white p-4">
      <p class="mb-3 text-[13px] font-medium text-stone-600">Actions</p>
      <div v-if="actionError" class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
        {{ actionError }}
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="action in allowedActions"
          :key="action"
          type="button"
          :disabled="actionLoading"
          class="rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="performAction(action)"
        >
          {{ STATUS_LABELS[action] }}
        </button>
      </div>
    </div>
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue
    <div v-if="detail" class="mt-4">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900"
        @click="toggleVersions"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          class="transition-transform"
          :class="showVersions ? 'rotate-90' : ''"
          aria-hidden="true"
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        View version history
      </button>

      <div v-if="showVersions" class="mt-3 flex flex-col gap-2.5">
        <div
          v-if="versionsLoading"
          class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500"
        >
          Loading versions…
        </div>

        <div
          v-else-if="versionsError"
          class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm"
        >
          <p class="mb-2.5 text-red-700">{{ versionsError }}</p>
          <button
            type="button"
            class="rounded-lg bg-orange-50 px-3.5 py-1.5 text-[13px] font-semibold text-orange-700 hover:brightness-95"
            @click="loadVersions"
          >
            Try again
          </button>
        </div>

        <div
          v-else-if="otherVersions.length === 0"
          class="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500"
        >
          No other versions.
        </div>

        <div
          v-for="v in otherVersions"
          v-else
          :key="v.id"
          class="overflow-hidden rounded-xl border border-stone-200 bg-white"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50"
            @click="toggleVersionDetail(v.id)"
          >
            <span class="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
              v{{ v.version }}
            </span>
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              :class="TYPE_BADGE[v.type]"
            >
              {{ TYPE_LABELS[v.type] }}
            </span>
            <span class="min-w-0 flex-1 truncate text-[13.5px] text-stone-700">{{ v.content }}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              class="flex-shrink-0 text-stone-400 transition-transform"
              :class="expandedVersionId === v.id ? 'rotate-90' : ''"
              aria-hidden="true"
            >
              <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <div v-if="expandedVersionId === v.id" class="border-t border-stone-200 px-4 py-3.5">
            <div v-if="versionDetailLoadingId === v.id" class="py-2 text-center text-sm text-stone-500">
              Loading…
            </div>
            <div v-else-if="versionDetailErrors[v.id]" class="py-2 text-center text-sm text-red-700">
              {{ versionDetailErrors[v.id] }}
            </div>
            <div v-else-if="versionDetails[v.id]">
              <p class="text-[14px] leading-relaxed">{{ versionDetails[v.id].content }}</p>
<<<<<<< HEAD:src/views/insights/InsightDetailPage.vue
              <div class="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                  {{ new Date(versionDetails[v.id].createdAt).toLocaleDateString() }}
                </span>
                <span v-if="versionDetails[v.id].sourcePlugin" class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                  {{ versionDetails[v.id].sourcePlugin }}
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                  {{ versionDetails[v.id].broadcasted ? 'Broadcasted' : 'Not broadcasted' }}
                </span>
              </div>
=======
              <dl class="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3">
                <div class="flex justify-between gap-3 text-[12.5px]">
                  <dt class="text-stone-500">Created</dt>
                  <dd class="text-right font-medium">{{ new Date(versionDetails[v.id].createdAt).toLocaleString() }}</dd>
                </div>
                <div class="flex justify-between gap-3 text-[12.5px]">
                  <dt class="text-stone-500">Source</dt>
                  <dd class="text-right font-medium">{{ versionDetails[v.id].sourcePlugin ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-3 text-[12.5px]">
                  <dt class="text-stone-500">Broadcasted</dt>
                  <dd class="text-right font-medium">{{ versionDetails[v.id].broadcasted ? 'Yes' : 'No' }}</dd>
                </div>
                <!-- <div v-if="versionDetails[v.id].envolopsRef.length" class="flex justify-between gap-3 text-[12.5px]"> -->
                <!--   <dt class="text-stone-500">References</dt> -->
                <!--   <dd class="text-right font-medium">{{ versionDetails[v.id].envolopsRef.join(', ') }}</dd> -->
                <!-- </div> -->
              </dl>
>>>>>>> cdc9405733d89a63d14657a17d0cca50568cfabd:src/views/InsightDetailPage.vue
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
