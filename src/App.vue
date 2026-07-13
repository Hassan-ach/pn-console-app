<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import DemoPage from "./demo/DemoPage.vue";
import InsightsDemoPage from "./demo/InsightsDemoPage.vue";
import SignupPage from "./views/SignupPage.vue";

const page = ref("telegram");

function onHashChange() {
  page.value = window.location.hash.replace("#", "") || "telegram";
}

function navigate(view: string) {
  window.location.hash = view;
}

onMounted(() => {
  onHashChange();
  window.addEventListener("hashchange", onHashChange);
});

onUnmounted(() => {
  window.removeEventListener("hashchange", onHashChange);
});
</script>

<template>
  <div class="flex justify-center gap-3 pt-3 pb-1 text-sm">
    <a
      href="#"
      @click.prevent="navigate('telegram')"
      :class="
        page === 'telegram'
          ? 'text-[#FF8C4B] font-semibold'
          : 'text-gray-400 hover:text-gray-600'
      "
      >Telegram Demo</a
    >
    <span class="text-gray-300">|</span>
    <a
      href="#"
      @click.prevent="navigate('insights')"
      :class="
        page === 'insights'
          ? 'text-[#FF8C4B] font-semibold'
          : 'text-gray-400 hover:text-gray-600'
      "
      >Insights Demo</a
    >
    <span class="text-gray-300">|</span>
    <a
      href="#"
      @click.prevent="navigate('signup')"
      :class="
        page === 'signup'
          ? 'text-[#FF8C4B] font-semibold'
          : 'text-gray-400 hover:text-gray-600'
      "
      >Sign Up</a
    >
  </div>
  <DemoPage v-if="page === 'telegram'" />
  <InsightsDemoPage v-else-if="page === 'insights'" />
  <SignupPage v-else-if="page === 'signup'" />
</template>
