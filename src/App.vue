<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import DemoPage from "./demo/DemoPage.vue";
import InsightsDemoPage from "./demo/InsightsDemoPage.vue";
import SignupPage from "./views/SignupPage.vue";
import LoginPage from "./views/LoginPage.vue";
import DashboardPage from "./views/DashboardPage.vue";
import NavBar from "./components/NavBar.vue";

const signupKey = ref(0);

const AUTH_PAGES = new Set(["dashboard", "telegram", "insights"]);

const oauthTokenMatch = window.location.hash.match(/access_token=([^&]+)/);
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

function resolvePage(hash: string): string {
  const p = hash.replace("#", "").split("?")[0] || "";
  const authenticated = isAuthenticated();
  if (authenticated) {
    if (!p || p === "login" || p === "signup") return "dashboard";
    return p;
  }
  if (p === "login" || p === "signup") return p;
  return "login";
}

const page = ref(resolvePage(window.location.hash));

const currentHash = window.location.hash.replace("#", "").split("?")[0] || "";
if (page.value !== currentHash) {
  window.location.hash = page.value;
}

function onHashChange() {
  const raw = window.location.hash.replace("#", "");
  page.value = raw.split("?")[0] || "";

  const authenticated = isAuthenticated();
  if (!authenticated) {
    if (page.value !== "login" && page.value !== "signup") {
      window.location.hash = "login";
      return;
    }
  } else {
    if (page.value === "login" || page.value === "signup") {
      window.location.hash = "dashboard";
      return;
    }
  }
}

function onOauthMessage(event: MessageEvent) {
  if (event.origin !== window.location.origin) return;
  if (event.data?.type === "oauth-success") {
    sessionStorage.setItem("access_token", event.data.token);
    window.location.hash = "#dashboard";
  }
}

const showNavBar = computed(() => AUTH_PAGES.has(page.value));

onMounted(async () => {
  const hash = window.location.hash;
  const match = hash.match(/access_token=([^&]+)/);
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

    window.location.hash = "dashboard";
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
        window.location.hash = "#dashboard";
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
  <NavBar v-if="showNavBar" />
  <LoginPage v-if="page === 'login'" />
  <SignupPage v-else-if="page === 'signup'" :key="'signup-' + signupKey" />
  <DashboardPage v-else-if="page === 'dashboard'" />
  <DemoPage v-else-if="page === 'telegram'" />
  <InsightsDemoPage v-else-if="page === 'insights'" />
</template>
