<template>
  <router-link
    to="/settings-telegram"
    class="block bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
  >
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-base font-semibold text-gray-900">Manage integrations</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          View and manage all your connected services
        </p>
      </div>
      <svg
        class="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
    </div>
  </router-link>
</template>
