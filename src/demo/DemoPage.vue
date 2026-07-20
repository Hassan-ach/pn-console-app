<script setup lang="ts">
import { ref } from 'vue';
import { PluginManagerClient, type Insight } from '../api/plugin-manager';

const manager = new PluginManagerClient();

const loading = ref(false);
const limit = ref(20);
const status = ref('Ready');
const inserted = ref(0);

const backfillComplete = ref(false);
const envelopeCount = ref(0);
const insights = ref<Insight[]>([]);

async function backfill() {
  loading.value = true;
  backfillComplete.value = false;
  insights.value = [];
  try {
    const result = await manager.backfill('telegram', limit.value);
    inserted.value = result.inserted;
    status.value = `Inserted ${result.inserted} messages`;

    const countRes = await manager.getEnvelopeCount('telegram');
    envelopeCount.value = countRes.count;

    backfillComplete.value = true;
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loading.value = false;
}

async function fetchInsights() {
  loading.value = true;
  try {
    const result = await manager.getInsights();
    insights.value = result;
    status.value = result.length > 0 ? `${result.length} insights loaded` : 'No insights yet';
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loading.value = false;
}

function typeClass(type: string): string {
  return `badge-${type.toLowerCase()}`;
}
</script>

<template>
  <main class="demo">
    <h1>Telegram Demo</h1>
    <p>Status: <strong>{{ status }}</strong></p>

    <section>
      <h3>Backfill</h3>
      <input v-model.number="limit" type="number" style="width: 70px" />
      <button @click="backfill" :disabled="loading">Backfill</button>

      <div v-if="backfillComplete" class="results">
        <p class="stat">Inserted: <strong>{{ inserted }}</strong> messages</p>
        <p class="stat">Total envelopes: <strong>{{ envelopeCount }}</strong></p>
      </div>

      <button @click="fetchInsights" :disabled="loading">Get Insights</button>
    </section>

    <section v-if="insights.length > 0">
      <h3>Insights ({{ insights.length }})</h3>
      <div v-for="(insight, i) in insights" :key="insight.id ?? i" class="insight-card">
        <span :class="['badge', typeClass(insight.type)]">{{ insight.type }}</span>
        <p class="insight-content">{{ insight.content }}</p>
        <div class="insight-meta">
          <span v-if="insight.owners.length" class="owners">
            Owners: {{ insight.owners.join(', ') }}
          </span>
          <span v-if="insight.createdAt" class="date">
            {{ new Date(insight.createdAt).toLocaleString() }}
          </span>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.demo { max-width: 700px; margin: 2rem auto; font-family: sans-serif; }
section { margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 6px; }
input, button { margin: 0.25rem; padding: 0.4rem 0.8rem; }
input, button { margin: 0.25rem; padding: 0.4rem 0.8rem; }

.results { margin-top: 0.75rem; }
.stat { margin: 0.25rem 0; }

.insight-card { padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa; }
.badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #fff; }
.badge-task { background: #3b82f6; }
.badge-urgency { background: #ef4444; }
.badge-info { background: #22c55e; }
.badge-decision { background: #a855f7; }
.insight-content { margin: 0.5rem 0; font-size: 0.9rem; line-height: 1.4; white-space: pre-wrap; }
.insight-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: #888; }
</style>
