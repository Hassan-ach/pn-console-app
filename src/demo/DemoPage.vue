<script setup lang="ts">
import { ref } from 'vue';
import { PluginManagerClient } from '../api/frontend-plugin-manager';

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

let pendingId = '';
let passwordPendingId = '';

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
  try {
    const result = await manager.backfill('telegram', limit.value);
    inserted.value = result.inserted;
    status.value = `Inserted ${result.inserted} messages`;
  } catch (e: any) {
    status.value = `Error: ${e.message ?? e}`;
  }
  loading.value = false;
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
      <input v-model="chatId" placeholder="Chat ID" />
      <input v-model.number="limit" type="number" style="width: 70px" />
      <button @click="backfill" :disabled="loading">Backfill</button>
      <p v-if="inserted">Inserted: {{ inserted }} messages</p>
    </section>
  </main>
</template>

<style scoped>
.demo { max-width: 600px; margin: 2rem auto; font-family: sans-serif; }
section { margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 6px; }
input, button { margin: 0.25rem; padding: 0.4rem 0.8rem; }
</style>
