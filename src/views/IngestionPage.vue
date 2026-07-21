<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { PluginManagerClient, type PluginInfo } from '../api/plugin-manager';
import PluginCard from '../components/PluginCard.vue';
import AlertBanner from '../components/AlertBanner.vue';
import PluginStatus from '../components/ingestion/PluginStatus.vue';
import { userError } from '../utils/plugin';

const manager = new PluginManagerClient();

interface PluginSelection {
  name: string;
  selected: boolean;
  limit: number;
  loading: boolean;
  result: { inserted: number; envelopes: number } | null;
  error: string;
  lastSynced: number | null;
}

const plugins = ref<PluginInfo[]>([]);
const selections = ref<Map<string, PluginSelection>>(new Map());
const overallLoading = ref(false);
const successText = ref('');
const errorText = ref('');

const selectedCount = computed(() => {
  let n = 0;
  for (const s of selections.value.values()) if (s.selected) n++;
  return n;
});

onMounted(async () => {
  try {
    plugins.value = await manager.list();
    const map = new Map<string, PluginSelection>();
    for (const p of plugins.value) {
      map.set(p.name, { name: p.name, selected: false, limit: -1, loading: false, result: null, error: '', lastSynced: null });
    }
    selections.value = map;
  } catch (e: any) {
    errorText.value = 'Failed to load integrations: ' + userError(e.message ?? e, e.message ?? e);
  }
});

function sel(name: string): PluginSelection | undefined {
  return selections.value.get(name);
}

function connectHref(pluginName: string): string | undefined {
  const map: Record<string, string> = {
    telegram: '#settings-telegram?connect=true',
  };
  return map[pluginName];
}

function toggle(name: string) {
  const s = selections.value.get(name);
  if (s) s.selected = !s.selected;
}

async function backfillOne(s: PluginSelection) {
  s.loading = true;
  s.result = null;
  s.error = '';
  try {
    const r = await manager.backfill([{ plugin: s.name, limit: s.limit }]);
    const countRes = await manager.getEnvelopeCount(s.name);
    s.result = { inserted: r.inserted, envelopes: countRes.count };
    s.lastSynced = Date.now();
  } catch (e: any) {
    s.error = userError(e.message ?? String(e), e.message ?? String(e));
  }
  s.loading = false;
}

async function runBackfill() {
  overallLoading.value = true;
  successText.value = '';
  errorText.value = '';
  let ok = 0, fail = 0;

  for (const s of selections.value.values()) {
    if (!s.selected) continue;
    await backfillOne(s);
    if (s.error) fail++; else ok++;
  }

  overallLoading.value = false;
  if (fail === 0) {
    successText.value = `Backfill complete — ${ok} plugin(s) refreshed`;
  } else {
    errorText.value = `${ok} succeeded, ${fail} failed — see cards for details`;
  }
}

async function retryOne(name: string) {
  const s = selections.value.get(name);
  if (!s) return;
  await backfillOne(s);
}
</script>

<template>
  <main class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Ingestion</h1>

    <AlertBanner v-if="successText" type="success" :message="successText" @dismiss="successText = ''" />
    <AlertBanner v-if="errorText" type="error" :message="errorText" @dismiss="errorText = ''" />

    <div class="flex items-center justify-between mb-4 gap-4">
      <p v-if="plugins.length" class="text-sm text-gray-500">{{ plugins.length }} integration(s)</p>
      <div class="relative group">
        <button
          @click="runBackfill"
          :disabled="overallLoading || selectedCount === 0"
          class="px-4 py-2 bg-[#FF8C4B] text-white text-sm font-medium rounded-md hover:bg-[#e67a3e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {{ overallLoading ? 'Running...' : 'Refresh' }}
        </button>
        <div
          v-if="selectedCount === 0 && !overallLoading"
          class="absolute top-full mt-1 right-0 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
        >
          Select at least one integration
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="p in plugins"
        :key="p.name"
        class="flex-1"
      >
        <PluginCard
          :name="p.name"
          :connected="p.connected ?? false"
          :connectHref="connectHref(p.name)"
          :selected="sel(p.name)?.selected ?? false"
          :selectable="true"
          :limit="sel(p.name)?.limit"
          @select="toggle(p.name)"
          @update:limit="(v: number) => { const s = sel(p.name); if (s) s.limit = v; }"
        />

        <PluginStatus
          :loading="sel(p.name)?.loading ?? false"
          :result="sel(p.name)?.result ?? null"
          :error="sel(p.name)?.error ?? ''"
          :last-synced="sel(p.name)?.lastSynced ?? null"
          @retry="retryOne(p.name)"
        />
      </div>

      <div v-if="plugins.length === 0" class="text-sm text-gray-400 py-8 text-center">
        No integrations found.
      </div>
    </div>
  </main>
</template>
