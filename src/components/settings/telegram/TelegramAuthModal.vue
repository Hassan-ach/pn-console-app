<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { PluginManagerClient } from '../../../api/plugin-manager';
import { useTelegramAuth } from '../../../composables/useTelegramAuth';
import AlertBanner from '../../AlertBanner.vue';
import ApiCredentialsForm from './ApiCredentialsForm.vue';
import VerificationCodeForm from './VerificationCodeForm.vue';
import PasswordForm from './PasswordForm.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  success: [username: string];
}>();

const client = new PluginManagerClient();
const auth = useTelegramAuth();

type WizardStep = 'credentials' | 'code' | 'password';
const wizardStep = ref<WizardStep>('credentials');

interface Credentials {
  apiId: number;
  apiHash: string;
}
const savedCredentials = ref<Credentials | null>(null);

const error = ref('');
const submitting = ref(false);
const codeFormRef = ref<InstanceType<typeof VerificationCodeForm> | null>(null);

const stepDefs = [
  { key: 'credentials', label: 'Phone' },
  { key: 'code', label: 'Code' },
  { key: 'password', label: 'Password' },
];

const currentStep = computed(() =>
  stepDefs.findIndex((s) => s.key === wizardStep.value),
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetWizard();
    }
  },
);

function resetWizard() {
  wizardStep.value = 'credentials';
  savedCredentials.value = null;
  error.value = '';
  submitting.value = false;
  auth.reset();
}

function userError(raw: string, fallback: string): string {
  const map: Record<string, string> = {
    PHONE_NUMBER_INVALID:
      'The phone number is invalid. Check the format (+countrycode...).',
    PHONE_CODE_INVALID: 'The verification code is incorrect.',
    PHONE_CODE_EXPIRED: 'The verification code has expired. Request a new one.',
    SESSION_PASSWORD_NEEDED:
      'Requires two-factor authentication — enter your password.',
    AUTH_KEY_DUPLICATED: 'This session was terminated by another login.',
    FLOOD_WAIT: 'Too many requests. Please wait a moment and try again.',
    PASSWORD_HASH_INVALID: 'Incorrect password. Please try again.',
  };
  const key = Object.keys(map).find((k) => raw.includes(k));
  return key ? map[key] : fallback;
}

async function onCredentialsSubmit(
  apiId: number,
  apiHash: string,
  phone: string,
) {
  savedCredentials.value = { apiId, apiHash };
  submitting.value = true;
  error.value = '';
  try {
    await auth.sendCode(apiId, apiHash, phone);
    wizardStep.value = 'code';
  } catch (err: any) {
    error.value =
      auth.state.value.error ?? err.message ?? 'Failed to send code';
  } finally {
    submitting.value = false;
  }
}

async function onCodeSubmit(code: string) {
  submitting.value = true;
  error.value = '';
  try {
    await auth.submitCode(code);
    if (auth.state.value.step === 'awaiting-password') {
      wizardStep.value = 'password';
    } else {
      await onAuthComplete();
    }
  } catch (err: any) {
    error.value = auth.state.value.error ?? err.message ?? 'Invalid code';
    codeFormRef.value?.resetCodeFields();
  } finally {
    submitting.value = false;
  }
}

async function onPasswordSubmit(password: string) {
  submitting.value = true;
  error.value = '';
  try {
    await auth.submitPassword(password);
    await onAuthComplete();
  } catch (err: any) {
    error.value = userError(
      auth.state.value.error ?? err.message ?? '',
      'Invalid password',
    );
  } finally {
    submitting.value = false;
  }
}

async function onAuthComplete() {
  if (!savedCredentials.value) return;

  const configPayload = {
    apiId: savedCredentials.value.apiId,
    apiHash: savedCredentials.value.apiHash,
    sessionString: auth.state.value.sessionString,
    phone: auth.state.value.phone,
    chats: [],
  } as any;

  const result = await client.login('telegram', configPayload);

  localStorage.setItem(
    'telegram_config',
    JSON.stringify({
      apiId: savedCredentials.value.apiId,
      apiHash: savedCredentials.value.apiHash,
      sessionString: auth.state.value.sessionString,
      phone: auth.state.value.phone,
      chats: [],
    }),
  );

  emit('success', result.platformUsername);
  emit('close');
}

function goBack() {
  wizardStep.value = 'credentials';
  error.value = '';
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between p-5 border-b border-gray-100"
        >
          <h2 class="text-lg font-bold text-gray-900">Connect Telegram</h2>
          <button
            type="button"
            @click="handleClose"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="p-5 space-y-5">
          <!-- Step Indicator -->
          <div class="flex items-center justify-center gap-0">
            <template v-for="(s, i) in stepDefs" :key="s.key">
              <div class="flex items-center">
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  :class="
                    i < currentStep
                      ? 'bg-green-500 text-white'
                      : i === currentStep
                        ? 'bg-[#FF8C4B] text-white'
                        : 'bg-gray-200 text-gray-400'
                  "
                >
                  {{ i + 1 }}
                </div>
                <span
                  class="ml-1.5 text-xs font-medium whitespace-nowrap"
                  :class="
                    i < currentStep
                      ? 'text-green-600'
                      : i === currentStep
                        ? 'text-[#FF8C4B]'
                        : 'text-gray-400'
                  "
                >
                  {{ s.label }}
                </span>
              </div>
              <div
                v-if="i < stepDefs.length - 1"
                class="w-8 h-0.5 mx-2 rounded"
                :class="i < currentStep ? 'bg-green-400' : 'bg-gray-200'"
              />
            </template>
          </div>

          <AlertBanner
            v-if="error"
            type="error"
            :message="error"
            @dismiss="error = ''"
          />

          <!-- Step 1: Credentials / Phone -->
          <div v-if="wizardStep === 'credentials'">
            <ApiCredentialsForm
              :busy="submitting"
              @submit="onCredentialsSubmit"
            />
          </div>

          <!-- Step 2: Verification Code -->
          <div v-if="wizardStep === 'code'">
            <VerificationCodeForm
              ref="codeFormRef"
              :phone="auth.state.value.phone"
              :busy="submitting"
              @submit="onCodeSubmit"
              @resend="resetWizard"
            />
            <button
              type="button"
              @click="goBack"
              class="mt-4 text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
            >
              &larr; Back to phone number
            </button>
          </div>

          <!-- Step 3: Password (if 2FA enabled) -->
          <div v-if="wizardStep === 'password'">
            <PasswordForm :busy="submitting" @submit="onPasswordSubmit" />
            <button
              type="button"
              @click="goBack"
              class="mt-4 text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
            >
              &larr; Back to phone number
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
