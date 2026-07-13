<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import DemoPage from "./demo/DemoPage.vue";
import InsightsDemoPage from "./demo/InsightsDemoPage.vue";
import SignupPage from "./views/SignupPage.vue";

const page = ref("telegram");

function onHashChange() {
  const raw = window.location.hash.replace("#", "");
  page.value = raw.split("?")[0] || "telegram";
}

function navigate(view: string) {
  window.location.hash = view;
}

onMounted(() => {
  onHashChange();
  const hash = window.location.hash;
  const match = hash.match(/access_token=([^&]+)/);
  if (match) {
    localStorage.setItem("access_token", match[1]);

    if (window.opener && window.opener !== window) {
      window.opener.sessionStorage.setItem("google_signup_success", "1");
      window.close();
      return;
    }

    const page = hash.split("?")[0] || "#telegram";
    window.location.hash = page;
    if (hash.includes("google_success=1")) {
      sessionStorage.setItem("google_signup_success", "1");
    }
  }
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
