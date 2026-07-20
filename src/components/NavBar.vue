<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const currentPage = ref("");

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
  <nav
    class="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200"
  >
    <div class="flex items-center gap-6">
      <a
        href="#dashboard"
        @click.prevent="navigate('dashboard')"
        class="text-xl font-bold text-[#FF8C4B] tracking-tight"
      >
        mosaid.
      </a>
      <div class="flex items-center gap-1">
        <a
          href="#dashboard"
          @click.prevent="navigate('dashboard')"
          :class="
            currentPage === 'dashboard'
              ? 'text-[#FF8C4B] font-semibold'
              : 'text-gray-400 hover:text-gray-600'
          "
          class="px-3 py-1.5 text-sm transition-colors"
          >Dashboard</a
        >
        <span class="text-gray-300">|</span>
        <a
          href="#telegram"
          @click.prevent="navigate('telegram')"
          :class="
            currentPage === 'telegram'
              ? 'text-[#FF8C4B] font-semibold'
              : 'text-gray-400 hover:text-gray-600'
          "
          class="px-3 py-1.5 text-sm transition-colors"
          >Telegram Demo</a
        >
        <span class="text-gray-300">|</span>

<a
  href="#settings"
  @click.prevent="navigate('settings')"
  :class="
    currentPage === 'settings'
      ? 'text-[#FF8C4B] font-semibold'
      : 'text-gray-400 hover:text-gray-600'
  "
  class="px-3 py-1.5 text-sm transition-colors"
>
  Settings
</a>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Profile
      </button>
    </div>
  </nav>
</template>
