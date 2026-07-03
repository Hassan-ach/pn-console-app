<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getDatabase } from "../services/database/DataBaseClient";
import { GrammersTelegramClient } from "../plugins/telegram/client/grammers";
import { TelegramPlugin } from "../plugins/telegram";
import { TelegramCredentials } from "../plugins/telegram/credentials";
import { PluginManager } from "../plugins/manager";
import { ingestFromPlugin } from "../services/Ingestion/IngestionService";

const connected = ref(false);
const loading = ref(false);
const showOtp = ref(false);
const otp = ref("");
const chatId = ref("-1003913656430");
const limit = ref(20);
const msgCount = ref(0);
const status = ref("Disconnected");
const inserted = ref(0);

let unlisten: UnlistenFn | null = null;
let otpResolve: ((code: string) => void) | null = null;
let manager: PluginManager | null = null;

onMounted(async () => {
  try {
    unlisten = await listen("tg-code-needed", () => {
      showOtp.value = true;
      status.value = "Code required";
    });
  } catch {
    status.value = "Event listen failed";
  }
  try {
    const db = await getDatabase();
    const rows = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM envelope");
    msgCount.value = rows[0]?.count ?? 0;
  } catch {
    msgCount.value = 0;
  }
});

onUnmounted(() => {
  unlisten?.();
});

async function connect() {
  loading.value = true;
  status.value = "Connecting...";
  try {
    const client = new GrammersTelegramClient();
    const plugin = new TelegramPlugin(client);
    plugin.setCodeProvider(() => new Promise<string>((resolve) => {
      otpResolve = resolve;
    }));
    manager = new PluginManager();
    manager.register(plugin);
    await manager.initPlugin("telegram", { chats: [chatId.value || ""] });
    await manager.loginPlugin("telegram", new TelegramCredentials("", undefined));
    connected.value = true;
    status.value = "Connected";
  } catch (e: any) {
    status.value = `Error: ${e}`;
  }
  loading.value = false;
}

function submitOtp() {
  otpResolve?.(otp.value);
}

async function backfill() {
  if (!manager) {
    status.value = "Error: plugin manager not initialized";
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const result = await ingestFromPlugin(
      manager,
      "telegram",
      new Date(0),
      new Date(),
      limit.value,
    );
    inserted.value = result.inserted;
    status.value = `Inserted ${result.inserted}, conflicts ${result.conflicts}`;
  } catch (e: any) {
    status.value = `Error: ${e}`;
  }
  loading.value = false;
  await countMessages();
}

async function countMessages() {
  try {
    const db = await getDatabase();
    const rows = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM envelope");
    msgCount.value = rows[0]?.count ?? 0;
  } catch {
    msgCount.value = 0;
  }
}
</script>

<template>
  <main class="demo">
    <h1>Telegram Demo</h1>
    <p>Status: <strong>{{ status }}</strong></p>

    <section>
      <button @click="connect" :disabled="loading || connected">
        {{ connected ? "Connected" : "Connect" }}
      </button>
    </section>

    <section v-if="showOtp">
      <input v-model="otp" placeholder="OTP code" />
      <button @click="submitOtp">Submit</button>
    </section>

    <section v-if="connected">
      <h3>Backfill</h3>
      <input v-model="chatId" placeholder="Chat ID" />
      <input v-model.number="limit" type="number" style="width: 70px" />
      <button @click="backfill" :disabled="loading">Backfill</button>
      <p v-if="inserted">Last insert: {{ inserted }} messages</p>
    </section>

    <section>
      <h3>Database</h3>
      <p>Messages in DB: <strong>{{ msgCount }}</strong></p>
      <button @click="countMessages">Refresh</button>
    </section>
  </main>
</template>

<style scoped>
.demo { max-width: 600px; margin: 2rem auto; font-family: sans-serif; }
section { margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 6px; }
input, button { margin: 0.25rem; padding: 0.4rem 0.8rem; }
</style>
