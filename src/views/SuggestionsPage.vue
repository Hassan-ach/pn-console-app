<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
    suggestionsApi,
    InsightSuggestion,
    SuggestionActionType,
} from '../api/suggestions-api';
import { insightsApi, InsightDetail, formatDeadline } from '../api/insights-api';
import AlertBanner from '../components/AlertBanner.vue';

const props = defineProps<{
    id?: string;
    insightId?: string;
}>();

const router = useRouter();
const currentInsightId = computed(() => props.id || props.insightId);

const insightDetail = ref<InsightDetail | null>(null);
const suggestions = ref<InsightSuggestion[]>([]);
const selectedSuggestionId = ref<string | null>(null);
const isLoading = ref(true);
const isGenerating = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const actionTypeBadges: Record<
    SuggestionActionType,
    { label: string; bgClass: string; textClass: string }
> = {
    REASSIGN: {
        label: 'Reassign',
        bgClass: 'bg-indigo-50 border-indigo-200',
        textClass: 'text-indigo-700',
    },
    ESCALATE: {
        label: 'Escalate',
        bgClass: 'bg-rose-50 border-rose-200',
        textClass: 'text-rose-700',
    },
    DELEGATE: {
        label: 'Delegate',
        bgClass: 'bg-amber-50 border-amber-200',
        textClass: 'text-amber-700',
    },
    RECOMMENDATION: {
        label: 'Recommendation',
        bgClass: 'bg-emerald-50 border-emerald-200',
        textClass: 'text-emerald-700',
    },
    RISK_MITIGATION: {
        label: 'Risk Mitigation',
        bgClass: 'bg-purple-50 border-purple-200',
        textClass: 'text-purple-700',
    },
    NEXT_STEP: {
        label: 'Next Step',
        bgClass: 'bg-blue-50 border-blue-200',
        textClass: 'text-blue-700',
    },
    DISMISS: {
        label: 'Dismiss',
        bgClass: 'bg-stone-100 border-stone-300',
        textClass: 'text-stone-600',
    },
};

const contextSummaryList = computed(() => {
    if (!suggestions.value.length) return [];
    const firstWithContext = suggestions.value.find(
        (s: InsightSuggestion) => s.metadata?.contextSummary?.length,
    );
    if (firstWithContext?.metadata?.contextSummary) {
        return firstWithContext.metadata.contextSummary as string[];
    }
    // Fallback context bullets from insight or descriptions
    return suggestions.value.map(
        (s: InsightSuggestion) => `${s.title}: ${s.description}`,
    );
});

const selectedSuggestion = computed(() => {
    return (
        suggestions.value.find((s: InsightSuggestion) => s.id === selectedSuggestionId.value) ||
        suggestions.value[0] ||
        null
    );
});

async function loadData() {
    isLoading.value = true;
    errorMessage.value = null;
    try {
        if (currentInsightId.value) {
            const [insightRes, suggestionList] = await Promise.all([
                insightsApi
                    .get(currentInsightId.value)
                    .catch(() => null),
                suggestionsApi.getInsightSuggestions(currentInsightId.value),
            ]);

            insightDetail.value = insightRes;
            suggestions.value = suggestionList;

            if (suggestionList.length > 0) {
                // Default select first or first pending/accepted
                const active =
                    suggestionList.find((s: InsightSuggestion) => s.status === 'ACCEPTED') ||
                    suggestionList.find((s: InsightSuggestion) => s.status === 'PENDING') ||
                    suggestionList[0];
                selectedSuggestionId.value = active.id;
            }
        } else {
            suggestions.value = await suggestionsApi.getUserSuggestions();
            if (suggestions.value.length > 0) {
                selectedSuggestionId.value = suggestions.value[0].id;
            }
        }
    } catch (err) {
        errorMessage.value =
            err instanceof Error ? err.message : 'Failed to load suggestions';
    } finally {
        isLoading.value = false;
    }
}

async function forceRegenerate() {
    if (!currentInsightId.value) return;
    isGenerating.value = true;
    errorMessage.value = null;
    try {
        suggestions.value = await suggestionsApi.generateForInsight(
            currentInsightId.value,
        );
        if (suggestions.value.length > 0) {
            selectedSuggestionId.value = suggestions.value[0].id;
        }
        showSuccess('Fresh AI action suggestions generated!');
    } catch (err) {
        errorMessage.value =
            err instanceof Error ? err.message : 'Failed to generate suggestions';
    } finally {
        isGenerating.value = false;
    }
}

function selectOption(id: string) {
    selectedSuggestionId.value = id;
}

async function confirmChoice() {
    if (!selectedSuggestion.value) return;
    isSubmitting.value = true;
    errorMessage.value = null;
    try {
        const confirmedId = selectedSuggestion.value.id;
        const optionLabel = getOptionLabel(selectedSuggestion.value);
        await suggestionsApi.updateStatus(
            confirmedId,
            'ACCEPTED',
        );

        const msg = `Choice "${optionLabel}" confirmed successfully!`;
        router.push({ path: '/home', query: { msg } });
    } catch (err) {
        errorMessage.value =
            err instanceof Error ? err.message : 'Failed to confirm choice';
        isSubmitting.value = false;
    }
}

function getOptionLabel(item: InsightSuggestion, index = 0): string {
    if (item.metadata?.optionLabel) return item.metadata.optionLabel as string;
    const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
    return labels[index % labels.length];
}

function getOptionTitle(item: InsightSuggestion): string {
    if (item.metadata?.optionTitle) return item.metadata.optionTitle as string;
    return item.title;
}

function getOptionRisk(item: InsightSuggestion): string | null {
    if (item.metadata?.risk) return item.metadata.risk as string;
    return null;
}

function showSuccess(msg: string) {
    successMessage.value = msg;
    setTimeout(() => {
        if (successMessage.value === msg) successMessage.value = null;
    }, 3500);
}

function goBack() {
    router.back();
}

onMounted(() => {
    loadData();
});

watch(currentInsightId, () => {
    loadData();
});
</script>

<template>
    <AlertBanner
        v-if="successMessage"
        type="success"
        :message="successMessage"
        @dismiss="successMessage = null"
    />
    <AlertBanner
        v-if="errorMessage"
        type="error"
        :message="errorMessage"
        @dismiss="errorMessage = null"
    />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 min-h-screen flex flex-col justify-between">
        <div>
            <!-- Top Header Section -->
            <div class="flex items-start justify-between gap-4 mb-6">
                <div class="flex items-start gap-4">
                    <button
                        type="button"
                        @click="goBack"
                        class="mt-1 w-9 h-9 flex items-center justify-center bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer shadow-sm shrink-0"
                        title="Back"
                    >
                        <svg class="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div>
                        <h1 class="text-2xl font-bold text-stone-900 leading-snug">
                            {{ insightDetail?.content || selectedSuggestion?.title || 'Decision & Recommendations' }}
                        </h1>
                        <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500 font-medium">
                            <span>{{ insightDetail?.sourcePlugin ? `${insightDetail.sourcePlugin.toUpperCase()}_Team` : 'Enterprise_Intelligence' }}</span>
                            <span class="text-stone-300">•</span>
                            <span
                                v-if="insightDetail?.deadline"
                                class="text-rose-600 font-semibold"
                            >
                                Decision deadline {{ formatDeadline(insightDetail.deadline) }}
                            </span>
                            <span v-else class="text-stone-400">
                                No deadline specified
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    v-if="currentInsightId"
                    type="button"
                    @click="forceRegenerate"
                    :disabled="isGenerating || isLoading"
                    class="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FF8C4B] bg-[#FF8C4B]/10 hover:bg-[#FF8C4B]/20 border border-[#FF8C4B]/30 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shrink-0"
                >
                    <svg
                        :class="{ 'animate-spin': isGenerating }"
                        class="w-3.5 h-3.5 text-[#FF8C4B]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{{ isGenerating ? 'Regenerating...' : 'Regenerate' }}</span>
                </button>
            </div>

            <!-- Top Divider -->
            <hr class="border-stone-200/80 mb-8" />

            <!-- Loading State -->
            <div v-if="isLoading" class="py-20 text-center">
                <div class="w-10 h-10 border-3 border-[#FF8C4B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-sm font-semibold text-stone-800">Generating Context Summary & Action Options...</p>
                <p class="text-xs text-stone-400 mt-1">Analyzing Knowledge Graph & message dependencies</p>
            </div>

            <!-- Main Content Two-Column Grid -->
            <div v-else-if="suggestions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <!-- Left Column: CONTEXT SUMMARY -->
                <div>
                    <h2 class="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">
                        CONTEXT SUMMARY
                    </h2>

                    <div class="space-y-2">
                        <div
                            v-for="(bullet, idx) in contextSummaryList"
                            :key="idx"
                            class="bg-[#f6f4f0] border border-stone-200/60 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs"
                        >
                            <span class="text-[#FF8C4B] font-bold text-sm leading-none mt-0.5">•</span>
                            <p class="text-xs text-stone-700 font-medium leading-normal">
                                {{ bullet }}
                            </p>
                        </div>

                        <div v-if="contextSummaryList.length === 0" class="bg-[#f6f4f0] border border-stone-200/60 rounded-xl p-3 text-xs text-stone-500">
                            • {{ selectedSuggestion?.description || 'Context summary is available for this decision.' }}
                        </div>
                    </div>
                </div>

                <!-- Right Column: CHOOSE AN ACTION -->
                <div>
                    <h2 class="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">
                        CHOOSE AN ACTION
                    </h2>

                    <div class="space-y-3">
                        <div
                            v-for="(item, idx) in suggestions"
                            :key="item.id"
                            @click="selectOption(item.id)"
                            :class="[
                                selectedSuggestionId === item.id
                                    ? 'bg-[#fff8f5] border-2 border-[#FF8C4B] shadow-sm'
                                    : 'bg-[#f4f2ee] border border-stone-200 hover:border-stone-300',
                            ]"
                            class="rounded-2xl p-4 transition-all duration-200 cursor-pointer"
                        >
                            <!-- Option Label & Action Type Badge -->
                            <div class="flex items-center justify-between gap-2 mb-1.5">
                                <span
                                    :class="selectedSuggestionId === item.id ? 'text-[#FF8C4B]' : 'text-stone-700'"
                                    class="text-xs font-bold"
                                >
                                    {{ getOptionLabel(item, idx) }}
                                </span>

                                <span
                                    :class="[actionTypeBadges[item.actionType]?.bgClass, actionTypeBadges[item.actionType]?.textClass]"
                                    class="px-2 py-0.5 text-[10px] font-semibold rounded-md border tracking-wide uppercase shrink-0"
                                >
                                    {{ actionTypeBadges[item.actionType]?.label || item.actionType }}
                                </span>
                            </div>

                            <!-- Option Title / Description -->
                            <h3
                                :class="selectedSuggestionId === item.id ? 'text-stone-900 font-bold' : 'text-stone-800 font-medium'"
                                class="text-sm leading-snug"
                            >
                                {{ getOptionTitle(item) }}
                            </h3>

                            <!-- Optional Risk metadata -->
                            <div v-if="getOptionRisk(item)" class="mt-2 text-xs font-medium text-amber-700">
                                Risk: {{ getOptionRisk(item) }}
                            </div>

                            <div v-if="item.status === 'ACCEPTED'" class="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                ✓ Confirmed Choice
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-else class="py-16 text-center bg-white border border-stone-200 rounded-2xl p-8 max-w-md mx-auto my-8 shadow-sm">
                <div class="w-12 h-12 bg-[#FF8C4B]/10 text-[#FF8C4B] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 class="text-base font-bold text-stone-900">No Action Suggestions Available</h3>
                <p class="text-xs text-stone-500 mt-1">
                    No recommendations have been generated for this insight yet.
                </p>
            </div>
        </div>

        <!-- Bottom Sticky Footer Section -->
        <div
            v-if="!isLoading && suggestions.length > 0"
            class="sticky bottom-4 bg-white/95 backdrop-blur-md py-4 px-6 border border-stone-200/80 rounded-2xl mt-10 flex items-center justify-between shadow-lg z-10"
        >
            <div class="flex items-center gap-2 text-xs font-medium text-stone-600 truncate max-w-md">
                <span class="font-bold text-stone-900 shrink-0">Selected:</span>
                <span v-if="selectedSuggestion" class="text-[#FF8C4B] font-semibold truncate">
                    {{ getOptionLabel(selectedSuggestion) }} — {{ getOptionTitle(selectedSuggestion) }}
                </span>
                <span v-else class="text-stone-400 italic">None</span>
            </div>

            <button
                type="button"
                @click="confirmChoice"
                :disabled="isSubmitting || !selectedSuggestion"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#FF8C4B] hover:bg-[#e07538] active:scale-[0.98] rounded-xl shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 shrink-0"
            >
                <span>{{ isSubmitting ? 'Confirming...' : 'Confirm choice' }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
</template>
