<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { PluginManagerClient, type PluginInfo } from '../api/plugin-manager';
import PluginCard from '../components/PluginCard.vue';

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

function userError(raw: string, fallback: string): string {
  const map: Record<string, string> = {
    'SESSION_PASSWORD_NEEDED': 'This account requires two-factor authentication.',
    'PHONE_NUMBER_INVALID': 'The phone number is invalid. Check the format (+countrycode...).',
    'PHONE_CODE_INVALID': 'The verification code is incorrect.',
    'PHONE_CODE_EXPIRED': 'The verification code has expired. Request a new one.',
    'AUTH_KEY_DUPLICATED': 'This session was terminated by another login.',
    'FLOOD_WAIT': 'Too many requests. Please wait a moment and try again.',
    'CHAT_ID_INVALID': 'The chat ID or username could not be found.',
    'USERNAME_NOT_OCCUPIED': 'This username does not exist.',
  };
  const key = Object.keys(map).find(k => raw.includes(k));
  return key ? map[key] : fallback;
}

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

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function backfillOne(s: PluginSelection) {
  s.loading = true;
  s.result = null;
  s.error = '';
  try {
    const r = await manager.backfill(s.name, s.limit);
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

    <div
      v-if="successText"
      class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between"
    >
      <span>{{ successText }}</span>
      <button @click="successText = ''" class="text-green-400 hover:text-green-600 ml-2">&times;</button>
    </div>

    <div
      v-if="errorText"
      class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between"
    >
      <span>{{ errorText }}</span>
      <button @click="errorText = ''" class="text-red-400 hover:text-red-600 ml-2">&times;</button>
    </div>

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

        <div v-if="sel(p.name)?.loading" class="mt-1 ml-1 text-xs text-gray-400">Backfilling...</div>
        <div v-else-if="sel(p.name)?.result" class="mt-1 ml-1 flex items-center gap-2">
          <span class="text-xs text-green-600">
            Inserted {{ sel(p.name)!.result!.inserted }} — {{ sel(p.name)!.result!.envelopes }} total envelopes
          </span>
          <span v-if="sel(p.name)!.lastSynced" class="text-[10px] text-gray-400">
            synced {{ timeAgo(sel(p.name)!.lastSynced!) }}
          </span>
        </div>
        <div v-else-if="sel(p.name)?.error" class="mt-1 ml-1 flex items-center gap-2">
          <span class="text-xs text-red-600">{{ sel(p.name)!.error }}</span>
          <button
            @click="retryOne(p.name)"
            :disabled="overallLoading"
            class="text-xs text-[#FF8C4B] hover:underline disabled:text-gray-300 disabled:no-underline"
          >
            Retry
          </button>
        </div>
      </div>

      <div v-if="plugins.length === 0" class="text-sm text-gray-400 py-8 text-center">
        No integrations found.
      </div>
    </div>
  </main>
</template>
