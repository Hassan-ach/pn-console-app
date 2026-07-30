<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue';

const props = defineProps<{
  type: 'success' | 'error';
  message: string;
}>();
const emit = defineEmits<{
  dismiss: [];
}>();

const show = computed(() => !!props.message);

let timer: ReturnType<typeof setTimeout> | null = null;

const DURATION: Record<string, number> = {
  success: 3000,
  error: 5000,
};

watch(show, (val) => {
  if (timer) clearTimeout(timer);
  if (val) {
    timer = setTimeout(() => emit('dismiss'), DURATION[props.type]);
  }
}, { immediate: true });

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <Transition name="slide-down">
    <div
      v-if="show"
      class="fixed top-0 left-1/2 z-50 -translate-x-1/2 mx-4 mt-2 p-3 text-sm flex items-center justify-between shadow-md rounded-lg"
      :class="type === 'success'
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-red-50 border-red-200 text-red-700'"
    >
      <span>{{ message }}</span>
      <button @click="emit('dismiss')" class="ml-2 shrink-0 bg-transparent border-none cursor-pointer text-lg leading-none" :class="type === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'">&times;</button>
    </div>
  </Transition>
</template>

<style>
.slide-down-enter-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}
.slide-down-leave-active {
  transition: transform 0.25s ease-in, opacity 0.25s ease-in;
}
.slide-down-enter-from {
  transform: translateY(-100%);
}
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
