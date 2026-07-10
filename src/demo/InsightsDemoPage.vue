<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../api/client';

interface Message {
  content: string;
  type: 'direct' | 'email';
  authorId: string;
}

interface Insight {
  id: string | null;
  type: string;
  content: string;
  owners: string[];
  envolopsRef: string[];
  broadcasted: boolean;
}

const organizationId = ref('demo-org');
const messages = ref<Message[]>([
  {
    content: 'Hey team, we need to deploy the auth hotfix to production by Friday. @Alice can you handle the deployment? @Bob please review the PR before we ship.',
    type: 'direct',
    authorId: 'charlie',
  },
  {
    content: 'Heads up — the staging database is running low on disk space. We should migrate to the new RDS instance this week.',
    type: 'email',
    authorId: 'ops-bot',
  },
  {
    content: 'Just finished the Q3 revenue report. Numbers look good — 18% growth over last quarter. Sharing with the leadership team tomorrow.',
    type: 'direct',
    authorId: 'diana',
  },
  {
    content: 'The client wants a go/no-go decision on the mobile app scope by end of day. @Alice @Charlie need to align on what\'s in v1 vs v2.',
    type: 'direct',
    authorId: 'pm-lead',
  },
]);
const insights = ref<Insight[]>([]);
const status = ref('');
const generating = ref(false);
const persisting = ref(false);
const loadingAll = ref(false);
const allInsights = ref<Insight[]>([]);

function addMessage() {
  messages.value.push({ content: '', type: 'direct', authorId: '' });
}

function removeMessage(index: number) {
  messages.value.splice(index, 1);
}

async function generate() {
  generating.value = true;
  status.value = 'Generating insights...';
  insights.value = [];
  try {
    const result = await api.post<{ insights: Insight[] }>(
      '/demo/insights/generate',
      {
        organizationId: organizationId.value,
        messages: messages.value.filter((m) => m.content.trim()),
      },
    );
    insights.value = result.insights;
    status.value = `Generated ${result.insights.length} insight(s)`;
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  generating.value = false;
}

async function persist() {
  persisting.value = true;
  status.value = 'Persisting insights...';
  try {
    const result = await api.post<{ status: string; persisted: number }>(
      '/demo/insights/persist',
      {
        organizationId: organizationId.value,
        insights: insights.value,
      },
    );
    status.value = `Persisted ${result.persisted} insight(s)`;
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  persisting.value = false;
}

async function loadAll() {
  loadingAll.value = true;
  status.value = 'Loading all insights...';
  try {
    allInsights.value = await api.get<Insight[]>('/demo/insights');
    status.value = `Loaded ${allInsights.value.length} insight(s)`;
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loadingAll.value = false;
}
</script>

<template>
  <main class="demo">
    <h1>Insights Demo</h1>
    <p>Status: <strong>{{ status }}</strong></p>

    <section>
      <label>Organization ID</label>
      <input v-model="organizationId" placeholder="Organization ID" />
    </section>

    <section>
      <h3>Messages</h3>
      <div v-for="(msg, i) in messages" :key="i" class="message-row">
        <textarea v-model="msg.content" placeholder="Message content" rows="2" />
        <select v-model="msg.type">
          <option value="direct">Direct</option>
          <option value="email">Email</option>
        </select>
        <input v-model="msg.authorId" placeholder="Author ID (optional)" />
        <button @click="removeMessage(i)" :disabled="messages.length <= 1">x</button>
      </div>
      <button @click="addMessage">+ Add Message</button>
      <br />
      <button @click="generate" :disabled="generating || !organizationId">
        {{ generating ? 'Generating...' : 'Generate Insights' }}
      </button>
    </section>

    <section v-if="insights.length > 0">
      <h3>Generated Insights</h3>
      <div v-for="(insight, i) in insights" :key="i" class="insight-card">
        <span class="badge">{{ insight.type }}</span>
        <p>{{ insight.content }}</p>
        <small>Owners: {{ insight.owners.join(', ') || 'none' }}</small><br />
        <small>Broadcasted: {{ insight.broadcasted }}</small>
      </div>
      <button @click="persist" :disabled="persisting">
        {{ persisting ? 'Persisting...' : 'Persist Insights' }}
      </button>
    </section>

    <section>
      <button @click="loadAll" :disabled="loadingAll">
        {{ loadingAll ? 'Loading...' : 'Load All Insights' }}
      </button>
      <div v-if="allInsights.length > 0" style="margin-top: 1rem;">
        <h3>All Insights ({{ allInsights.length }})</h3>
        <div v-for="(insight, i) in allInsights" :key="insight.id ?? i" class="insight-card">
          <span class="badge">{{ insight.type }}</span>
          <p>{{ insight.content }}</p>
          <small>Owners: {{ insight.owners.join(', ') || 'none' }}</small><br />
          <small>Broadcasted: {{ insight.broadcasted }}</small>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.demo { max-width: 600px; margin: 2rem auto; font-family: sans-serif; }
section { margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 6px; }
label { display: block; margin-bottom: 0.25rem; font-weight: bold; }
input, select, textarea { margin: 0.25rem 0; padding: 0.4rem 0.6rem; width: 100%; box-sizing: border-box; }
button { margin: 0.5rem 0.25rem 0 0; padding: 0.4rem 0.8rem; cursor: pointer; }
.message-row { margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #eee; }
.message-row input, .message-row select, .message-row textarea { width: 100%; }
.message-row button { width: auto; }
.insight-card { background: #f9f9f9; padding: 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; }
.badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 3px; background: #4a90d9; color: #fff; font-size: 0.75rem; font-weight: bold; }
</style>
