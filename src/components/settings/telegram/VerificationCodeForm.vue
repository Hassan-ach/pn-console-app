<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

const props = defineProps<{
  phone: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  submit: [code: string];
  resend: [];
}>();

const codeDigits = ref(['', '', '', '', '']);
const error = ref('');
const inputs = ref<(HTMLInputElement | null)[]>([]);

// Resend countdown
const RESEND_DELAY = 120;
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function startCountdown() {
  countdown.value = RESEND_DELAY;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
}

startCountdown();

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});

function onResend() {
  if (countdown.value > 0) return;
  emit('resend');
  startCountdown();
}

function onSubmit() {
  error.value = '';
  const fullCode = codeDigits.value.join('');
  if (fullCode.length !== 5 || !/^\d{5}$/.test(fullCode)) {
    error.value = 'Enter the 5-digit code';
    return;
  }
  emit('submit', fullCode);
}

function onDigitInput(index: number) {
  const digit = codeDigits.value[index];
  if (digit && index < 5) {
    inputs.value[index + 1]?.focus();
  }
  if (codeDigits.value.every((d) => d !== '') && codeDigits.value.length === 5) {
    onSubmit();
  }
}

function resetCodeFields() {
  codeDigits.value = ['', '', '', '', ''];
  error.value = '';
  setTimeout(() => inputs.value[0]?.focus(), 0);
}

defineExpose({ resetCodeFields });

function onDigitKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus();
  }
}

function setInputRef(el: HTMLInputElement | null, index: number) {
  inputs.value[index] = el;
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">Verification Code</h3>
    <p class="text-sm text-gray-500">
      Code sent to <strong>{{ props.phone }}</strong>
    </p>

    <div class="flex gap-2 justify-center">
      <input
        v-for="(digit, i) in codeDigits"
        :key="i"
        :ref="(el: any) => setInputRef(el as HTMLInputElement | null, i)"
        :value="digit"
        @input="(e: any) => {
          const val = e.target.value.replace(/\D/g, '');
          codeDigits[i] = val.slice(-1);
          onDigitInput(i);
        }"
        @keydown="(e: any) => onDigitKeydown(i, e)"
        maxlength="1"
        class="w-11 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/40 focus:border-[#FF8C4B]"
      />
    </div>

    <p v-if="error" class="text-sm text-red-600 text-center">{{ error }}</p>

    <div class="flex justify-between items-center">
      <button
        @click="onResend"
        :disabled="countdown > 0"
        class="text-sm text-[#FF8C4B] hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
      >
        {{ countdown > 0 ? `Resend in ${countdown}s` : 'Resend code' }}
      </button>

      <button
        @click="onSubmit"
        :disabled="busy || codeDigits.some((d) => d === '')"
        class="px-4 py-2 text-sm text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {{ busy ? 'Verifying...' : 'Verify' }}
      </button>
    </div>
  </div>
</template>
