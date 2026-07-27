<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import SideNavBar from "../components/SideNavBar.vue";
import PageHeader from "../components/PageHeader.vue";
import DashboardPage from "./DashboardPage.vue";
import IngestionPage from "./IngestionPage.vue";
import InsightsRouterOutlet from "../demo/InsightsRouterOutlet.vue";
import SettingsPage from "./SettingsPage.vue";
import JobsPage from "./JobsPage.vue";
import TelegramIntegration from "./settings/TelegramIntegration.vue";

const currentPage = ref("");

function onHashChange() {
  const raw = window.location.hash.replace("#", "");
  currentPage.value = raw.split("?")[0] || "";
}

const currentView = computed(() => {
  if (!currentPage.value || currentPage.value === "home") return "dashboard";
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
        <IngestionPage v-else-if="currentView === 'ingestion'" />
        <JobsPage v-else-if="currentView === 'jobs'" />
        <InsightsRouterOutlet v-else-if="currentView === 'insights'" />
        <SettingsPage v-else-if="currentView === 'settings'" />
        <TelegramIntegration v-else-if="currentView === 'settings-telegram'" />
      </main>
    </div>
  </div>
</template>
