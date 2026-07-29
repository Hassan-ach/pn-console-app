<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import SideNavBar from "../components/SideNavBar.vue";
import PageHeader from "../components/PageHeader.vue";
import DashboardPage from "./DashboardPage.vue";
import InsightsRouterOutlet from "../demo/InsightsRouterOutlet.vue";
import SettingsPage from "./SettingsPage.vue";
import JobsPage from "./JobsPage.vue";
import IntegrationsPage from "./IntegrationsPage.vue";

const currentPage = ref("");

function onHashChange() {
  const raw = window.location.hash.replace("#", "");
  currentPage.value = raw.split("?")[0] || "";
}

const currentView = computed(() => {
  if (!currentPage.value || currentPage.value === "home") return "dashboard";
  if (currentPage.value === "settings-telegram") return "integrations";
  return currentPage.value;
});

onMounted(() => {
  onHashChange();
  window.addEventListener("hashchange", onHashChange);
});

onUnmounted(() => {
  window.removeEventListener("hashchange", onHashChange);
});
</script>

<template>
  <div class="min-h-screen bg-[#FCFAF8]">
    <PageHeader />
    <div class="flex">
      <SideNavBar :current-page="currentPage" />
      <main class="flex-1 p-8 min-w-0">
        <DashboardPage v-if="currentView === 'dashboard'" />
        <JobsPage v-else-if="currentView === 'jobs'" />
        <InsightsRouterOutlet v-else-if="currentView === 'insights'" />
        <SettingsPage v-else-if="currentView === 'settings'" />
        <IntegrationsPage v-else-if="currentView === 'integrations'" />
      </main>
    </div>
  </div>
</template>
