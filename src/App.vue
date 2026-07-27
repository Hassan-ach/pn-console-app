<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import LoginPage from "./views/LoginPage.vue";
import SignupPage from "./views/SignupPage.vue";
import HomePage from "./views/HomePage.vue";

const signupKey = ref(0);
const page = ref(window.location.hash.replace("#", "").split("?")[0] || "");

const rawHash = window.location.hash;
const oauthTokenMatch = rawHash.match(/access_token=([^&]+)/);
if (oauthTokenMatch) {
  sessionStorage.setItem("access_token", oauthTokenMatch[1]);
}

function isAuthenticated(): boolean {
  const token = sessionStorage.getItem("access_token");
  if (!token) return false;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function onHashChange() {
  const raw = window.location.hash.replace("#", "");
  const p = raw.split("?")[0] || "";
  if (!isAuthenticated() && p !== "login" && p !== "signup") {
    window.location.hash = "#login";
    return;
  }
  page.value = p;
}

function onOauthMessage(event: MessageEvent) {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "oauth-success") {
    sessionStorage.setItem("access_token", event.data.token);
    window.location.hash = "#home";
  }
}

onMounted(async () => {
  const match = rawHash.match(/access_token=([^&]+)/);
  if (match) {
    sessionStorage.setItem("access_token", match[1]);

    if (window.opener && window.opener !== window) {
      window.opener.postMessage(
        { type: "oauth-success", token: match[1] },
        window.location.origin,
      );
      window.close();
      return;
    }

    try {
      const { emitTo } = await import("@tauri-apps/api/event");
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await emitTo("main", "oauth-result", { token: match[1], is_new: false });
      await getCurrentWindow().close();
      return;
    } catch {
      // Not running in Tauri — fall through to hash navigation
    }

    window.location.hash = "home";
    return;
  }

  window.addEventListener("message", onOauthMessage);
  window.addEventListener("hashchange", onHashChange);
  onHashChange();

  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen<{ token: string; is_new: boolean }>(
      "oauth-result",
      (event) => {
        sessionStorage.setItem("access_token", event.payload.token);
        window.location.hash = "#home";
      },
    );
    await listen("oauth-cancelled", () => {
      signupKey.value++;
    });
  } catch {
    // Not running in Tauri — event listener is not available
  }
});

onUnmounted(() => {
  window.removeEventListener("message", onOauthMessage);
  window.removeEventListener("hashchange", onHashChange);
});
</script>

<template>
  <LoginPage v-if="page === 'login'" />
  <SignupPage v-else-if="page === 'signup'" :key="'signup-' + signupKey" />
  <HomePage v-else-if="isAuthenticated()" />
</template>
