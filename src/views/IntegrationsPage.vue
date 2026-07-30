<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  PluginManagerClient,
  type PluginActivationStatus,
  type PluginStatus,
} from '../api/plugin-manager';
import AlertBanner from '../components/AlertBanner.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import PluginIntegrationRow, {
  type PluginRowItem,
} from '../components/integrations/PluginIntegrationRow.vue';
import PluginConfigModal, {
  type ChatItem,
} from '../components/integrations/PluginConfigModal.vue';
import PluginDetailsModal from '../components/integrations/PluginDetailsModal.vue';
import TelegramAuthModal from '../components/settings/telegram/TelegramAuthModal.vue';

const client = new PluginManagerClient();

interface EnrichedPluginRow extends PluginRowItem {
  activation: PluginActivationStatus | null;
}

const plugins = ref<EnrichedPluginRow[]>([]);
const pageLoading = ref(true);
const error = ref('');
const success = ref('');

// Modal states
const showConfigModal = ref(false);
const showAuthModal = ref(false);
const showDeactivateDialog = ref(false);
const showDetailsModal = ref(false);

const deactivatePluginName = ref('');
const modalPlugin = ref('');
const modalChats = ref<ChatItem[]>([]);
const modalSaving = ref(false);
const modalError = ref('');

const detailsPluginName = ref('');
const detailsPluginStatus = ref<PluginStatus>('CONNECTED');
const detailsActivation = ref<PluginActivationStatus | null>(null);
const detailsChats = ref<ChatItem[]>([]);

onMounted(load);

async function load() {
  pageLoading.value = true;
  try {
    const list = await client.list();
    const enriched = await Promise.all(
      list.map(async (p) => {
        try {
          if (!p.connected) {
            return {
              name: p.name,
              status: 'NOT_CONNECTED' as PluginStatus,
              activation: null,
              loading: false,
            };
          }
          const s = await client.getActivationStatus(p.name);
          return {
            name: p.name,
            status: (s.status || 'CONNECTED') as PluginStatus,
            activation: s,
            loading: false,
          };
        } catch {
          return {
            name: p.name,
            status: 'NOT_CONNECTED' as PluginStatus,
            activation: null,
            loading: false,
          };
        }
      }),
    );
    plugins.value = enriched;
  } catch {
    error.value = 'Failed to load integrations.';
  } finally {
    pageLoading.value = false;
  }
}

async function handleToggle(name: string) {
  const idx = plugins.value.findIndex((p) => p.name === name);
  const p = plugins.value[idx];
  if (!p || p.loading) return;

  if (p.status === 'ACTIVE') {
    deactivatePluginName.value = name;
    showDeactivateDialog.value = true;
    return;
  }

  p.loading = true;
  error.value = '';
  success.value = '';

  try {
    await client.activate(p.name);
    success.value = `${p.name} activated`;
    const s = await client.getActivationStatus(p.name);
    plugins.value[idx] = {
      name: p.name,
      status: s.status as PluginStatus,
      activation: s,
      loading: false,
    };
  } catch (e: any) {
    error.value = e.message ?? 'Failed to activate plugin';
    p.loading = false;
  }
}

async function confirmDeactivate() {
  showDeactivateDialog.value = false;
  const name = deactivatePluginName.value;
  const idx = plugins.value.findIndex((p) => p.name === name);
  const p = plugins.value[idx];
  if (!p || p.loading) return;

  p.loading = true;
  error.value = '';
  success.value = '';

  try {
    await client.deactivate(p.name);
    success.value = `${p.name} deactivated`;
    const s = await client.getActivationStatus(p.name);
    plugins.value[idx] = {
      name: p.name,
      status: s.status as PluginStatus,
      activation: s,
      loading: false,
    };
  } catch (e: any) {
    error.value = e.message ?? 'Failed to deactivate plugin';
    p.loading = false;
  }
}

function handleConnect(name: string) {
  if (name === 'telegram') {
    showAuthModal.value = true;
  }
}

async function handleAuthSuccess(username: string) {
  success.value = `Logged in to Telegram as @${username}`;
  await load();
}

async function handleDetails(name: string) {
  detailsPluginName.value = name;
  const p = plugins.value.find((item) => item.name === name);
  detailsPluginStatus.value = p?.status ?? 'CONNECTED';
  detailsActivation.value = p?.activation ?? null;

  try {
    const config = await client.getConfig(name);
    const existing: any[] = (config as any)?.chats ?? [];
    detailsChats.value = existing.map((c: any) => ({
      id: c.id,
      name: c.name,
      historyLimit: c.historyLimit ?? null,
    }));
  } catch {
    detailsChats.value = [];
  } finally {
    showDetailsModal.value = true;
  }
}

async function handleConfigure(name: string) {
  modalError.value = '';
  modalPlugin.value = name;

  try {
    const config = await client.getConfig(name);
    const existing: any[] = (config as any)?.chats ?? [];
    modalChats.value = existing.map((c: any) => ({
      id: c.id,
      name: c.name,
      historyLimit: c.historyLimit ?? null,
    }));
  } catch {
    modalChats.value = [];
  } finally {
    showConfigModal.value = true;
  }
}

async function handleSaveConfig(updatedConfig: Record<string, any>) {
  modalSaving.value = true;
  modalError.value = '';
  try {
    const payload = { ...updatedConfig };
    if (Array.isArray(payload.chats)) {
      payload.chats = payload.chats.map((c: any) => {
        const entry: Record<string, any> = { id: c.id, name: c.name };
        if (c.historyLimit != null) entry.historyLimit = c.historyLimit;
        return entry;
      });
    }
    await client.updateConfig(modalPlugin.value, payload);
    success.value = 'Configuration saved';
    showConfigModal.value = false;
    await load();
  } catch (e: any) {
    modalError.value = e.message ?? 'Failed to save configuration';
  } finally {
    modalSaving.value = false;
  }
}

async function handleDisconnect() {
  modalSaving.value = true;
  modalError.value = '';
  try {
    await client.logout(modalPlugin.value);
    success.value = `Disconnected from ${modalPlugin.value}`;
    showConfigModal.value = false;
    await load();
  } catch (e: any) {
    modalError.value = e.message ?? 'Failed to disconnect';
  } finally {
    modalSaving.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <nav class="text-sm text-gray-400 mb-6 flex items-center gap-2">
      <router-link to="/settings" class="hover:text-gray-600 transition-colors"
        >Settings</router-link
      >
      <span>/</span>
      <span class="text-[#FF8C4B] font-medium">Integrations</span>
    </nav>

    <h1 class="text-2xl font-bold text-gray-900 mb-6">Integrations</h1>

    <AlertBanner type="success" :message="success" @dismiss="success = ''" />
    <AlertBanner type="error" :message="error" @dismiss="error = ''" />

    <!-- Skeleton Loading -->
    <div v-if="pageLoading" class="space-y-3">
      <div
        v-for="i in 2"
        :key="i"
        class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse space-y-3"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-100" />
          <div class="h-4 w-24 bg-gray-100 rounded" />
          <div class="ml-auto h-6 w-16 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>

    <!-- Integrations List -->
    <div v-else class="space-y-3">
      <PluginIntegrationRow
        v-for="p in plugins"
        :key="p.name"
        :plugin="p"
        @connect="handleConnect"
        @toggle="handleToggle"
        @configure="handleConfigure"
        @details="handleDetails"
      />

      <div
        v-if="plugins.length === 0"
        class="text-sm text-gray-400 py-8 text-center"
      >
        No integrations available.
      </div>
    </div>

    <!-- Details Modal -->
    <PluginDetailsModal
      :open="showDetailsModal"
      :plugin-name="detailsPluginName"
      :status="detailsPluginStatus"
      :activation="detailsActivation"
      :config-chats="detailsChats"
      @close="showDetailsModal = false"
    />

    <!-- Config Modal -->
    <PluginConfigModal
      :open="showConfigModal"
      :plugin-name="modalPlugin"
      :chats="modalChats"
      :saving="modalSaving"
      :error="modalError"
      @close="showConfigModal = false"
      @save="handleSaveConfig"
      @disconnect="handleDisconnect"
      @clear-error="modalError = ''"
    />

    <!-- GramJS Auth Modal -->
    <TelegramAuthModal
      :open="showAuthModal"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />

    <!-- Deactivate Confirmation Dialog -->
    <ConfirmDialog
      :open="showDeactivateDialog"
      :title="`Deactivate ${deactivatePluginName}?`"
      message="Deactivating this plugin will pause monitoring and stop ongoing message ingestion. You can reactivate it at any time."
      confirm-label="Deactivate"
      cancel-label="Cancel"
      @confirm="confirmDeactivate"
      @cancel="showDeactivateDialog = false"
    />
  </div>
</template>
