<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PluginManagerClient } from '../../api/plugin-manager';
import { useTelegramAuth } from '../../composables/useTelegramAuth';
import StatusCard from '../../components/settings/telegram/StatusCard.vue';
import ApiCredentialsForm from '../../components/settings/telegram/ApiCredentialsForm.vue';
import VerificationCodeForm from '../../components/settings/telegram/VerificationCodeForm.vue';
import PasswordForm from '../../components/settings/telegram/PasswordForm.vue';
import ChatConfigForm from '../../components/settings/telegram/ChatConfigForm.vue';

const client = new PluginManagerClient();
const auth = useTelegramAuth();

const pluginConfig = ref<Record<string, unknown> | null>(null);
const configLoading = ref(true);

type WizardStep = 'idle' | 'credentials' | 'code' | 'password' | 'done';
const wizardStep = ref<WizardStep>('idle');

interface Credentials {
  apiId: number;
  apiHash: string;
}
const savedCredentials = ref<Credentials | null>(null);

const existingChats = ref<string[]>([]);

const error = ref('');
const success = ref('');
const submitting = ref(false);
let successTimer: ReturnType<typeof setTimeout> | null = null;

function setSuccess(msg: string) {
  success.value = msg;
  if (successTimer) clearTimeout(successTimer);
  successTimer = setTimeout(() => { success.value = ''; }, 5000);
}

onMounted(async () => {
  await loadConfig();
});

async function loadConfig() {
  configLoading.value = true;
  try {
    const config = await client.getConfig('telegram');
    pluginConfig.value = config;
    existingChats.value = (config as any).chats ?? [];
  } catch {
    pluginConfig.value = null;
  } finally {
    configLoading.value = false;
  }
}

function startConnect() {
  wizardStep.value = 'credentials';
  error.value = '';
}

async function onCredentialsSubmit(apiId: number, apiHash: string, phone: string) {
  savedCredentials.value = { apiId, apiHash };
  submitting.value = true;
  try {
    await auth.sendCode(apiId, apiHash, phone);
    wizardStep.value = 'code';
    error.value = '';
  } catch (err: any) {
    error.value = auth.state.value.error ?? err.message ?? 'Failed to send code';
  } finally {
    submitting.value = false;
  }
}

async function onCodeSubmit(code: string) {
  submitting.value = true;
  try {
    await auth.submitCode(code);
    if (auth.state.value.step === 'awaiting-password') {
      wizardStep.value = 'password';
    } else {
      await onAuthComplete();
    }
    error.value = '';
  } catch (err: any) {
    error.value = auth.state.value.error ?? err.message ?? 'Invalid code';
  } finally {
    submitting.value = false;
  }
}

async function onPasswordSubmit(password: string) {
  submitting.value = true;
  try {
    await auth.submitPassword(password);
    await onAuthComplete();
    error.value = '';
  } catch (err: any) {
    error.value = auth.state.value.error ?? err.message ?? 'Invalid password';
  } finally {
    submitting.value = false;
  }
}

async function onAuthComplete() {
  if (!savedCredentials.value) return;
  const chatList = existingChats.value.length > 0 ? existingChats.value : [];
  const configPayload = {
    apiId: savedCredentials.value.apiId,
    apiHash: savedCredentials.value.apiHash,
    sessionString: auth.state.value.sessionString,
    phone: auth.state.value.phone,
    chats: chatList,
  } as any;

  const msg = await client.createConfig('telegram', configPayload);
  setSuccess(msg);

  localStorage.setItem(
    'telegram_config',
    JSON.stringify({
      apiId: savedCredentials.value.apiId,
      apiHash: savedCredentials.value.apiHash,
      phone: auth.state.value.phone,
      chats: chatList,
    }),
  );

  wizardStep.value = 'done';
  await loadConfig();
}

async function onDisconnect() {
  try {
    const msg = await client.logout('telegram');
    setSuccess(msg);
  } catch (err: any) {
    error.value = err.message ?? 'Failed to disconnect';
  }
  auth.reset();
  savedCredentials.value = null;
  wizardStep.value = 'idle';
  existingChats.value = [];
  await loadConfig();
}

async function onSaveChats(chats: string[]) {
  try {
    const msg = await client.updateConfig('telegram', { chats } as any);
    setSuccess(msg);
    existingChats.value = chats;
    const stored = localStorage.getItem('telegram_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.chats = chats;
      localStorage.setItem('telegram_config', JSON.stringify(parsed));
    }
  } catch (err: any) {
    error.value = err.message ?? 'Failed to save chats';
  }
}

function onResendCode() {
  if (!savedCredentials.value) return;
  startConnect();
}

const isConnected = () =>
  pluginConfig.value !== null && !!(pluginConfig.value as any).sessionString;
</script>

<template>
  <main class="flex-1 p-8 bg-[#FCFAF8] min-h-screen">
    <div class="max-w-2xl mx-auto">
      <nav class="text-sm text-gray-400 mb-6">
        <a href="#settings" class="hover:text-gray-600">Settings</a>
        <span class="mx-2">/</span>
        <span class="text-gray-700">Integrations</span>
        <span class="mx-2">/</span>
        <span class="text-[#FF8C4B] font-medium">Telegram</span>
      </nav>

      <h1 class="text-2xl font-bold text-gray-900 mb-6">Telegram Integration</h1>

      <div class="mb-6">
        <StatusCard
          :connected="isConnected()"
          :phone="(pluginConfig as any)?.phone"
          :loading="configLoading"
          @connect="startConnect"
        />
      </div>

      <div
        v-if="success"
        class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between"
      >
        <span>{{ success }}</span>
        <button @click="success = ''" class="text-green-400 hover:text-green-600 ml-2">&times;</button>
      </div>

      <div
        v-if="error"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between"
      >
        <span>{{ error }}</span>
        <button @click="error = ''" class="text-red-400 hover:text-red-600 ml-2">&times;</button>
      </div>

      <div v-if="wizardStep === 'credentials'" class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <ApiCredentialsForm :busy="submitting" @submit="onCredentialsSubmit" />
      </div>

      <div v-if="wizardStep === 'code'" class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <VerificationCodeForm
          :phone="auth.state.value.phone"
          :busy="submitting"
          @submit="onCodeSubmit"
          @resend="onResendCode"
        />
      </div>

      <div v-if="wizardStep === 'password'" class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <PasswordForm :busy="submitting" @submit="onPasswordSubmit" />
      </div>

      <div v-if="wizardStep === 'done' || (isConnected() && wizardStep === 'idle')" class="bg-white border border-gray-200 rounded-lg p-5">
        <ChatConfigForm
          :phone="(pluginConfig as any)?.phone ?? auth.state.value.phone"
          :chats="existingChats"
          @save="onSaveChats"
          @disconnect="onDisconnect"
        />
      </div>
    </div>
  </main>
</template>
