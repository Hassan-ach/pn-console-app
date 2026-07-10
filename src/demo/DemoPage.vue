<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { PluginManagerClient, type Insight } from '../api/frontend-plugin-manager';

const manager = new PluginManagerClient();

const connected = ref(false);
const loading = ref(false);
const showCodeInput = ref(false);
const showPasswordInput = ref(false);
const code = ref('');
const password = ref('');
const chatId = ref('');
const limit = ref(20);
const status = ref('Disconnected');
const inserted = ref(0);

const backfillComplete = ref(false);
const envelopeCount = ref(0);
const isExtracting = ref(false);
const insights = ref<Insight[]>([]);
const extractionError = ref('');

let pendingId = '';
let passwordPendingId = '';
let pollTimer: ReturnType<typeof setInterval> | null = null;

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

async function connect() {
  loading.value = true;
  status.value = 'Connecting...';
  try {
    await manager.initialize('telegram', {
      userId: 'user_1',
      apiId: 33137605,
      apiHash: 'c27e098210632ac9ad93f266bdad87de',
      chats: [chatId.value || '-1003913656430'],
    });

    const result = await manager.login('telegram', {
      phoneNumber: '+212619646104',
    });

    if (result.status === 'need_code') {
      pendingId = result.pendingId ?? '';
      showCodeInput.value = true;
      status.value = 'Code sent — check Telegram';
      loading.value = false;
      return;
    }

    connected.value = true;
    status.value = 'Connected';
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loading.value = false;
}

async function submitCode() {
  if (!pendingId || !code.value) return;
  loading.value = true;
  try {
    const result = await manager.submitCode(pendingId, code.value);

    if (result.status === 'need_password') {
      passwordPendingId = result.pendingId ?? '';
      showCodeInput.value = false;
      showPasswordInput.value = true;
      status.value = '2FA required — enter password';
      loading.value = false;
      return;
    }

    connected.value = true;
    showCodeInput.value = false;
    status.value = 'Connected';
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loading.value = false;
}

async function submitPassword() {
  if (!passwordPendingId || !password.value) return;
  loading.value = true;
  try {
    await manager.submitPassword(passwordPendingId, password.value);
    connected.value = true;
    showPasswordInput.value = false;
    status.value = 'Connected';
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loading.value = false;
}

async function backfill() {
  loading.value = true;
  backfillComplete.value = false;
  insights.value = [];
  extractionError.value = '';
  try {
    const result = await manager.backfill('telegram', limit.value);
    inserted.value = result.inserted;
    status.value = `Inserted ${result.inserted} messages`;

    const countRes = await manager.getEnvelopeCount('telegram');
    envelopeCount.value = countRes.count;

    backfillComplete.value = true;
    startPolling();
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loading.value = false;
}

function startPolling() {
  isExtracting.value = true;
  let attempts = 0;
  const maxAttempts = 30;

  pollTimer = setInterval(async () => {
    attempts++;
    try {
      const result = await manager.getInsights();
      if (result.length > 0) {
        insights.value = result;
        isExtracting.value = false;
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = null;
        status.value = `Extraction complete: ${result.length} insights`;
      }
    } catch {
      // retry
    }

    if (attempts >= maxAttempts && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
      isExtracting.value = false;
      extractionError.value = 'Extraction timed out — check server logs';
      status.value = 'Extraction timed out';
    }
  }, 2000);
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
      <button @click="connect" :disabled="loading || connected || showCodeInput">
        {{ connected ? 'Connected' : 'Connect' }}
      </button>
    </section>

    <section v-if="showCodeInput">
      <input v-model="code" placeholder="OTP code" />
      <button @click="submitCode" :disabled="loading">Submit Code</button>
    </section>

    <section v-if="showPasswordInput">
      <input v-model="password" type="password" placeholder="2FA password" />
      <button @click="submitPassword" :disabled="loading">Submit Password</button>
    </section>

    <section v-if="connected">
      <h3>Backfill</h3>
      <input v-model.number="limit" type="number" style="width: 70px" />
      <button @click="backfill" :disabled="loading">Backfill</button>

      <div v-if="backfillComplete" class="results">
        <p class="stat">Inserted: <strong>{{ inserted }}</strong> messages</p>
        <p class="stat">Total envelopes: <strong>{{ envelopeCount }}</strong></p>
      </div>

      <div v-if="isExtracting" class="extracting">
        <span class="spinner"></span>
        Running intelligence extraction...
      </div>

      <div v-if="extractionError" class="error">
        {{ extractionError }}
      </div>
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

.extracting { margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; color: #666; }
.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #ccc; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error { margin-top: 0.75rem; color: #ef4444; }

.insight-card { padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #e5e7eb; border-radius: 6px; background: #fafafa; }
.badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #fff; }
.badge-task { background: #3b82f6; }
.badge-urgency { background: #ef4444; }
.badge-info { background: #22c55e; }
.badge-decision { background: #a855f7; }
.insight-content { margin: 0.5rem 0; font-size: 0.9rem; line-height: 1.4; white-space: pre-wrap; }
.insight-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: #888; }
</style>
