<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  busy?: boolean;
}>();
const emit = defineEmits<{
  submit: [password: string];
}>();

const password = ref('');
const error = ref('');

function onSubmit() {
  error.value = '';
  if (!password.value) {
    error.value = 'Password is required';
    return;
  }
  emit('submit', password.value);
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
    <p class="text-sm text-gray-500">
      Your Telegram account has 2FA enabled. Enter your password to continue.
    </p>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
      <input
        v-model="password"
        type="password"
        placeholder="Enter your Telegram password"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/40 focus:border-[#FF8C4B]"
        @keydown.enter="onSubmit"
      />
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <button
      @click="onSubmit"
      :disabled="busy || !password"
      class="w-full px-4 py-2 text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {{ busy ? 'Verifying...' : 'Submit Password' }}
    </button>
  </div>
</template>
