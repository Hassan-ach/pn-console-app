<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { PluginManagerClient, type PluginInfo, type PluginActivationStatus } from '../api/plugin-manager';
import PluginCard from '../components/PluginCard.vue';
import AlertBanner from '../components/AlertBanner.vue';
import MetricsPanel from '../components/ingestion/MetricsPanel.vue';
import ChatConfigForm from '../components/settings/telegram/ChatConfigForm.vue';
import type { ChatEntry } from '../components/settings/telegram/ChatConfigForm.vue';
import { userError } from '../utils/plugin';

const client = new PluginManagerClient();

interface EnrichedPlugin extends PluginInfo {
  status: string;
  activation: PluginActivationStatus | null;
  configError: string;
}

const plugins = ref<EnrichedPlugin[]>([]);
const expanded = ref<string | null>(null);
const successText = ref('');
const errorText = ref('');
const polling = ref<ReturnType<typeof setInterval> | null>(null);

onMounted(async () => {
  await loadPlugins();
  polling.value = setInterval(loadPlugins, 5000);
});

onUnmounted(() => {
  if (polling.value) clearInterval(polling.value);
});

function connectHref(pluginName: string): string | undefined {
  const map: Record<string, string> = {
    telegram: '#settings-telegram?connect=true',
  };
  return map[pluginName];
}

async function loadPlugins() {
  try {
    const list = await client.list();
    const enriched = await Promise.all(list.map(async (p) => {
      if (p.hasConfig || p.connected) {
        try {
          const status = await client.getActivationStatus(p.name);
          return { ...p, status: status.status, activation: status, configError: '' };
        } catch {
          return { ...p, status: 'CONNECTED', activation: null, configError: '' };
        }
      }
      return { ...p, status: 'NOT_CONNECTED', activation: null, configError: '' };
    }));
    plugins.value = enriched;
  } catch (e: any) {
    errorText.value = 'Failed to load integrations: ' + userError(e.message ?? e, e.message ?? e);
  }
}

function toggleExpand(name: string) {
  expanded.value = expanded.value === name ? null : name;
}

async function activate(name: string) {
  try {
    await client.activate(name);
    successText.value = `${name} activated`;
    await loadPlugins();
  } catch (e: any) {
    errorText.value = `Failed to activate ${name}: ${userError(e.message ?? e, e.message ?? e)}`;
  }
}

async function deactivate(name: string) {
  try {
    await client.deactivate(name);
    successText.value = `${name} deactivated`;
    await loadPlugins();
  } catch (e: any) {
    errorText.value = `Failed to deactivate ${name}: ${userError(e.message ?? e, e.message ?? e)}`;
  }
}

async function saveChats(name: string, chats: ChatEntry[]) {
  try {
    await client.updateChats(name, chats);
    successText.value = `Chats saved for ${name}`;
    await loadPlugins();
  } catch (e: any) {
    errorText.value = `Failed to save chats: ${userError(e.message ?? e, e.message ?? e)}`;
  }
}

async function disconnect(name: string) {
  try {
    await client.logout(name);
    successText.value = `${name} disconnected`;
    expanded.value = null;
    await loadPlugins();
  } catch (e: any) {
    errorText.value = `Failed to disconnect: ${userError(e.message ?? e, e.message ?? e)}`;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Ingestion</h1>

    <AlertBanner v-if="successText" type="success" :message="successText" @dismiss="successText = ''" />
    <AlertBanner v-if="errorText" type="error" :message="errorText" @dismiss="errorText = ''" />

    <div class="space-y-4">
      <div v-for="p in plugins" :key="p.name" class="flex-1">
        <PluginCard
          :name="p.name"
          :connected="p.connected ?? false"
          :connectHref="connectHref(p.name)"
          :status="(p.status as any)"
          :chats="p.activation?.chats?.map(c => ({ name: c.chatId, id: c.chatId })) ?? []"
          :activation="null"
          :errorMessage="p.activation?.errorMessage"
          :selected="expanded === p.name"
          :selectable="true"
          @select="toggleExpand(p.name)"
          @activate="activate(p.name)"
          @deactivate="deactivate(p.name)"
          @configure-chats="toggleExpand(p.name)"
          @disconnect="disconnect(p.name)"
        />

        <div
          v-if="expanded === p.name"
          class="border border-t-0 border-gray-200 rounded-b-lg bg-white p-5 -mt-1 mb-4"
        >
          <ChatConfigForm
            v-if="p.status !== 'NOT_CONNECTED' && p.status !== 'ACTIVE'"
            :phone="''"
            :chats="p.activation?.chats?.map(c => ({ name: c.chatId, id: c.chatId })) ?? []"
            @save="(chats) => saveChats(p.name, chats)"
            @disconnect="disconnect(p.name)"
          />
          <MetricsPanel
            v-else-if="p.status === 'ACTIVE' && p.activation"
            :activation="{
              chatCount: p.activation.chats.length,
              batchCount: p.activation.chats.reduce((s, c) => s + (c.stream.batchesFlushed ?? 0), 0),
              messageCount: 0,
              backfillProgress: null,
              streamUptime: p.activation.chats[0]?.stream.uptime ? p.activation.chats[0].stream.uptime * 1000 : undefined,
            }"
          />
          <p v-else class="text-sm text-gray-400 py-4 text-center">Connect this integration first to configure chats.</p>
        </div>
      </div>

      <div v-if="plugins.length === 0" class="text-sm text-gray-400 py-8 text-center">
        No integrations found.
      </div>
    </div>
  </div>
</template>
