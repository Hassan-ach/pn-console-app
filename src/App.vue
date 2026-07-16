<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from "vue";
import DemoPage from "./demo/DemoPage.vue";
import InsightsDemoPage from "./demo/InsightsDemoPage.vue";
import SignupPage from "./views/SignupPage.vue";

const page = ref("telegram");
const oauthToken = ref<string | null>(null);
const signupKey = ref(0);
provide("oauthToken", oauthToken);

function onHashChange() {
  const raw = window.location.hash.replace("#", "");
  page.value = raw.split("?")[0] || "telegram";
}

function navigate(view: string) {
  if (view === "signup") {
    if (page.value === "signup") {
      signupKey.value++;
    }
    oauthToken.value = null;
    sessionStorage.removeItem("google_signup_success");
  }
  window.location.hash = view;
}

onMounted(async () => {
  onHashChange();
  const hash = window.location.hash;
  const match = hash.match(/access_token=([^&]+)/);
  if (match) {
    localStorage.setItem("access_token", match[1]);

    if (window.opener && window.opener !== window) {
      if (
        hash.includes("google_success=1") ||
        hash.includes("microsoft_success=1") ||
        hash.includes("sso_success=1")
      ) {
        window.opener.sessionStorage.setItem("google_signup_success", "1");
      }
      window.close();
      return;
    }

    const page = hash.split("?")[0] || "#telegram";
    window.location.hash = page;
    if (
      hash.includes("google_success=1") ||
      hash.includes("microsoft_success=1") ||
      hash.includes("sso_success=1")
    ) {
      sessionStorage.setItem("google_signup_success", "1");
    }
  }
  window.addEventListener("hashchange", onHashChange);

  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen<{ token: string; is_new: boolean }>(
      "oauth-result",
      (event) => {
        localStorage.setItem("access_token", event.payload.token);
        if (event.payload.is_new) {
          sessionStorage.setItem("google_signup_success", "1");
        }
        oauthToken.value = event.payload.token;
        window.location.hash = "#signup";
      },
    );
    await listen("oauth-cancelled", () => {
      signupKey.value++;
      oauthToken.value = null;
      sessionStorage.removeItem("google_signup_success");
    });
  } catch {
    // Not running in Tauri — event listener is not available
  }
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
  <SignupPage v-else-if="page === 'signup'" :key="'signup-' + signupKey" />
</template>
