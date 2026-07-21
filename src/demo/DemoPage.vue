<script setup lang="ts">
import { ref } from 'vue';
import { PluginManagerClient } from '../api/plugin-manager';

const manager = new PluginManagerClient();

const loading = ref(false);
const limit = ref(20);
const inserted = ref(0);

const backfillComplete = ref(false);
const envelopeCount = ref(0);
const successText = ref('');
const errorText = ref('');

async function backfill() {
  loading.value = true;
  backfillComplete.value = false;
  successText.value = '';
  errorText.value = '';
  try {
    const result = await manager.backfill('telegram', limit.value);
    inserted.value = result.inserted;
    successText.value = `Backfill complete — ${result.inserted} messages inserted`;

    const countRes = await manager.getEnvelopeCount('telegram');
    envelopeCount.value = countRes.count;

    backfillComplete.value = true;
  } catch (e: any) {
    errorText.value = e.message ?? String(e);
  }
  loading.value = false;
}
</script>

<template>
  <main class="demo">
    <h1>Telegram Demo</h1>
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

    <section>
      <h3>Backfill</h3>
      <input v-model.number="limit" type="number" style="width: 70px" />
      <button @click="backfill" :disabled="loading">Backfill</button>

      <div v-if="backfillComplete" class="results">
        <p class="stat">Inserted: <strong>{{ inserted }}</strong> messages</p>
        <p class="stat">Total envelopes: <strong>{{ envelopeCount }}</strong></p>
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


</style>
