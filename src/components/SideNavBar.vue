<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const currentPage = ref("");
const isCollapsed = ref(localStorage.getItem("sidebar-collapsed") === "true");

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem("sidebar-collapsed", String(isCollapsed.value));
}

function onHashChange() {
  const raw = window.location.hash.replace("#", "");
  currentPage.value = raw.split("?")[0] || "";
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
  <aside
    :class="isCollapsed ? 'w-[68px]' : 'w-60'"
    class="h-[calc(100vh-72px)] bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 sticky top-[72px]"
  >
    <nav class="flex-1 px-2 py-3 space-y-1">
      <button
        type="button"
        @click="toggleCollapse"
        class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200 cursor-pointer"
        :title="isCollapsed ? 'Expand' : 'Collapse'"
      >
        <svg
          :class="isCollapsed ? 'rotate-180' : ''"
          class="w-5 h-5 flex-shrink-0 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          Expand
        </span>
      </button>

      <a
        href="#home"
        @click.prevent="navigate('home')"
        :class="
          currentPage === 'home' || currentPage === 'dashboard'
            ? 'bg-[#FF8C4B]/10 text-[#FF8C4B]'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        "
        class="relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
        :title="isCollapsed ? 'Home' : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span v-if="!isCollapsed" class="whitespace-nowrap">Home</span>
        <span
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          Home
        </span>
      </a>

      <a
        href="#ingestion"
        @click.prevent="navigate('ingestion')"
        :class="
          currentPage === 'ingestion'
            ? 'bg-[#FF8C4B]/10 text-[#FF8C4B]'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        "
        class="relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
        :title="isCollapsed ? 'Ingestion' : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span v-if="!isCollapsed" class="whitespace-nowrap">Ingestion</span>
        <span
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          Ingestion
        </span>
      </a>

      <a
        href="#jobs"
        @click.prevent="navigate('jobs')"
        :class="
          currentPage === 'jobs'
            ? 'bg-[#FF8C4B]/10 text-[#FF8C4B]'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        "
        class="relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
        :title="isCollapsed ? 'Jobs' : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 6h.01M16 12h.01" />
        </svg>
        <span v-if="!isCollapsed" class="whitespace-nowrap">Jobs</span>
        <span
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          Jobs
        </span>
      </a>

      <a
        href="#insights"
        @click.prevent="navigate('insights')"
        :class="
          currentPage === 'insights'
            ? 'bg-[#FF8C4B]/10 text-[#FF8C4B]'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        "
        class="relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
        :title="isCollapsed ? 'Insights' : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span v-if="!isCollapsed" class="whitespace-nowrap">Insights</span>
        <span
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          Insights
        </span>
      </a>

      <a
        href="#settings"
        @click.prevent="navigate('settings')"
        :class="
          currentPage === 'settings' || currentPage === 'settings-telegram'
            ? 'bg-[#FF8C4B]/10 text-[#FF8C4B]'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        "
        class="relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
        :title="isCollapsed ? 'Settings' : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span v-if="!isCollapsed" class="whitespace-nowrap">Settings</span>
        <span
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          Settings
        </span>
      </a>
    </nav>

    <div class="px-2 py-3 border-t border-gray-100">
      <button
        type="button"
        class="relative w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200 cursor-pointer"
        :title="isCollapsed ? 'Profile' : ''"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span v-if="!isCollapsed" class="whitespace-nowrap">Profile</span>
        <span
          v-if="isCollapsed"
          class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
        >
          Profile
        </span>
      </button>
    </div>
  </aside>
</template>
