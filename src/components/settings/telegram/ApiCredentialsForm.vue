<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  submit: [apiId: number, apiHash: string, phone: string];
}>();

const apiId = ref('');
const apiHash = ref('');
const phone = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  error.value = '';

  const parsedId = Number(apiId.value);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    error.value = 'apiId must be a positive integer';
    return;
  }
  if (!apiHash.value.trim()) {
    error.value = 'apiHash is required';
    return;
  }
  const phoneClean = phone.value.trim();
  if (!phoneClean.startsWith('+') || phoneClean.length < 8) {
    error.value = 'Phone must start with + and country code (e.g., +212199999999)';
    return;
  }

  loading.value = true;
  try {
    emit('submit', parsedId, apiHash.value.trim(), phoneClean);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">API Credentials</h3>
    <p class="text-sm text-gray-500">
      Get your
      <a
        href="https://my.telegram.org/apps"
        target="_blank"
        class="text-[#FF8C4B] underline hover:no-underline"
      >apiId and apiHash from my.telegram.org</a>
    </p>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">apiId</label>
      <input
        v-model="apiId"
        type="number"
        placeholder="12345678"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/40 focus:border-[#FF8C4B]"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">apiHash</label>
      <input
        v-model="apiHash"
        type="text"
        placeholder="0123456789abcdef0123456789abcdef"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/40 focus:border-[#FF8C4B]"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
      <input
        v-model="phone"
        type="tel"
        placeholder="+212199999999"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/40 focus:border-[#FF8C4B]"
      />
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <button
      @click="onSubmit"
      :disabled="loading"
      class="w-full px-4 py-2 text-white bg-[#FF8C4B] rounded-lg hover:bg-[#e67e3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
    >
      {{ loading ? 'Sending code...' : 'Send Code' }}
    </button>
  </div>
</template>
