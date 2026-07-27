<script setup lang="ts">
defineProps<{
  dataSources: { connected: number; total: number };
  insights: number;
  activeJobs: number;
}>();
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-blue-50 rounded-lg">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{{ dataSources.connected }}</p>
          <p class="text-xs text-gray-500">of {{ dataSources.total }} connected</p>
        </div>
      </div>
      <p class="mt-3 text-sm font-medium text-gray-700">Data Sources</p>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-amber-50 rounded-lg">
          <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{{ insights }}</p>
          <p class="text-xs text-gray-500">total</p>
        </div>
      </div>
      <p class="mt-3 text-sm font-medium text-gray-700">Insights</p>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-emerald-50 rounded-lg">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{{ activeJobs }}</p>
          <p class="text-xs text-gray-500">running</p>
        </div>
      </div>
      <p class="mt-3 text-sm font-medium text-gray-700">Active Jobs</p>
    </div>
  </div>
</template>
