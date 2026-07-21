<script setup lang="ts">
defineProps<{
  type: 'success' | 'error';
  message: string;
}>();
const emit = defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <div
    class="mb-4 p-3 rounded-lg text-sm flex items-center justify-between"
    :class="type === 'success'
      ? 'bg-green-50 border border-green-200 text-green-700'
      : 'bg-red-50 border border-red-200 text-red-700'"
  >
    <span>{{ message }}</span>
    <button @click="emit('dismiss')" class="ml-2" :class="type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'">&times;</button>
  </div>
</template>
