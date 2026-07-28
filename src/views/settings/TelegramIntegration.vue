<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PluginManagerClient } from '../../api/plugin-manager';
import { useTelegramAuth } from '../../composables/useTelegramAuth';
import PluginCard from '../../components/PluginCard.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import ApiCredentialsForm from '../../components/settings/telegram/ApiCredentialsForm.vue';
import VerificationCodeForm from '../../components/settings/telegram/VerificationCodeForm.vue';
import PasswordForm from '../../components/settings/telegram/PasswordForm.vue';
import ChatConfigForm, { type ChatEntry } from '../../components/settings/telegram/ChatConfigForm.vue';

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

const existingChats = ref<ChatEntry[]>([]);
const connectedSince = ref<number | null>(null);

const error = ref('');
const success = ref('');
const submitting = ref(false);
const showDisconnectDialog = ref(false);
const codeFormRef = ref<InstanceType<typeof VerificationCodeForm> | null>(null);
let successTimer: ReturnType<typeof setTimeout> | null = null;

const stepDefs = [
  { key: 'credentials', label: 'Phone' },
  { key: 'code', label: 'Code' },
  { key: 'password', label: 'Password' },
  { key: 'done', label: 'Done' },
];

const currentStep = computed(() => stepDefs.findIndex(s => s.key === wizardStep.value));

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function userError(raw: string, fallback: string): string {
  const map: Record<string, string> = {
    'PHONE_NUMBER_INVALID': 'The phone number is invalid. Check the format (+countrycode...).',
    'PHONE_CODE_INVALID': 'The verification code is incorrect.',
    'PHONE_CODE_EXPIRED': 'The verification code has expired. Request a new one.',
    'SESSION_PASSWORD_NEEDED': 'Requires two-factor authentication — enter your password.',
    'AUTH_KEY_DUPLICATED': 'This session was terminated by another login.',
    'FLOOD_WAIT': 'Too many requests. Please wait a moment and try again.',
    'CHAT_ID_INVALID': 'The chat ID or username could not be found.',
    'USERNAME_NOT_OCCUPIED': 'This username does not exist.',
    'PASSWORD_HASH_INVALID': 'Incorrect password. Please try again.',
    'Could not find the input entity': 'Could not find this chat or user. Check the ID/username and try again.',
  };
  const key = Object.keys(map).find(k => raw.includes(k));
  return key ? map[key] : fallback;
}

function setSuccess(msg: string) {
  success.value = msg;
  if (successTimer) clearTimeout(successTimer);
  successTimer = setTimeout(() => { success.value = ''; }, 5000);
}

onMounted(async () => {
  await loadConfig();
  const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  if (params.get('connect') === 'true' && !hasSession.value) {
    window.location.hash = 'settings-telegram';
    startConnect();
  }
});

async function loadConfig() {
  configLoading.value = true;
  try {
    const config = await client.getConfig('telegram');
    pluginConfig.value = config;
    const raw = (config as any).chats ?? [];
    existingChats.value = Array.isArray(raw)
      ? raw.map((c: any) => typeof c === 'string' ? { name: c, id: c } : { name: c.name ?? c.id, id: c.id ?? c })
      : [];
    const state = await client.getState('telegram');
    hasSession.value = state.hasSession ?? false;
  } catch {
    pluginConfig.value = null;
    hasSession.value = false;
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
    codeFormRef.value?.resetCodeFields();
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
    error.value = userError(auth.state.value.error ?? err.message ?? '', 'Invalid password');
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
    chats: chatList.map(c => ({ name: c.name, id: c.id })),
  } as any;

  const result = await client.login('telegram', configPayload);
  setSuccess(`Logged in to Telegram as @${result.platformUsername}`);

  localStorage.setItem(
    'telegram_config',
    JSON.stringify({
      apiId: savedCredentials.value.apiId,
      apiHash: savedCredentials.value.apiHash,
      sessionString: auth.state.value.sessionString,
      phone: auth.state.value.phone,
      chats: chatList,
    }),
  );

  hasSession.value = true;

  wizardStep.value = 'done';
  await loadConfig();
}

function goBack() {
  wizardStep.value = 'credentials';
  error.value = '';
}

async function confirmDisconnect() {
  showDisconnectDialog.value = false;
  try {
    const msg = await client.logout('telegram');
    setSuccess(msg);
  } catch (err: any) {
    error.value = userError(err.message ?? '', 'Failed to disconnect. Please try again.');
  }
  auth.reset();
  savedCredentials.value = null;
  hasSession.value = false;
  connectedSince.value = null;
  localStorage.removeItem('telegram_connected_since');
  wizardStep.value = 'idle';
  existingChats.value = [];
  await loadConfig();
}

async function onSaveChats(chats: ChatEntry[]) {
  try {
    const msg = await client.updateConfig('telegram', { chats } as any);
    setSuccess(msg);
    existingChats.value = chats;
    const stored = localStorage.getItem('telegram_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.chats = chats.map(c => ({ name: c.name, id: c.id }));
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

const hasSession = ref(false);
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

      <div v-if="wizardStep === 'idle'" class="mb-6">
        <PluginCard
          name="telegram"
          :connected="hasSession"
          :phone="(pluginConfig as any)?.phone"
          :loading="configLoading"
          :status="hasSession ? 'CONNECTED' : 'NOT_CONNECTED'"
          @connect="startConnect"
        />
      </div>

      <div v-else class="mb-6">
        <div class="flex items-center justify-center gap-0">
          <template v-for="(s, i) in stepDefs" :key="s.key">
            <div class="flex items-center">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                :class="i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-[#FF8C4B] text-white' : 'bg-gray-200 text-gray-400'"
              >{{ i + 1 }}</div>
              <span
                class="ml-1.5 text-xs font-medium whitespace-nowrap"
                :class="i < currentStep ? 'text-green-600' : i === currentStep ? 'text-[#FF8C4B]' : 'text-gray-400'"
              >{{ s.label }}</span>
            </div>
            <div
              v-if="i < stepDefs.length - 1"
              class="w-8 h-0.5 mx-2 rounded"
              :class="i < currentStep ? 'bg-green-400' : 'bg-gray-200'"
            />
          </template>
        </div>
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
          ref="codeFormRef"
          :phone="auth.state.value.phone"
          :busy="submitting"
          @submit="onCodeSubmit"
          @resend="onResendCode"
        />
        <button @click="goBack" class="mt-4 text-sm text-gray-500 hover:text-gray-700 underline">
          &larr; Back to phone number
        </button>
      </div>

      <div v-if="wizardStep === 'password'" class="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <PasswordForm :busy="submitting" @submit="onPasswordSubmit" />
        <button @click="goBack" class="mt-4 text-sm text-gray-500 hover:text-gray-700 underline">
          &larr; Back to phone number
        </button>
      </div>

      <div v-if="wizardStep === 'done' || (hasSession && wizardStep === 'idle')" class="bg-white border border-gray-200 rounded-lg p-5">
        <ChatConfigForm
          :phone="(pluginConfig as any)?.phone ?? auth.state.value.phone"
          :chats="existingChats"
          @save="onSaveChats"
          @disconnect="showDisconnectDialog = true"
        />
        <p v-if="connectedSince" class="mt-3 text-[10px] text-gray-400 text-right">
          Connected {{ timeAgo(connectedSince) }}
        </p>
      </div>
    </div>

    <ConfirmDialog
      :open="showDisconnectDialog"
      title="Disconnect Telegram?"
      message="This will sign you out of Telegram on this device and clear your local configuration. You'll need to reconnect to resume monitoring."
      confirm-label="Disconnect"
      @confirm="confirmDisconnect"
      @cancel="showDisconnectDialog = false"
    />
  </main>
</template>
