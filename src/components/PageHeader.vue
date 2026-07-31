<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUser } from '../composables/useUser';

const router = useRouter();
const { profile } = useUser();

const userName = computed(() => profile.value?.firstName ?? 'User');
const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});
</script>

<template>
    <header
        class="sticky top-0 z-10 bg-white border-b border-gray-200 h-[72px] flex items-center shrink-0"
    >
        <div class="flex items-center justify-between w-full px-6">
            <div class="flex items-center gap-6">
                <button
                    type="button"
                    @click="router.push('/home')"
                    class="text-xl font-bold text-[#FF8C4B] tracking-tight cursor-pointer"
                >
                    mosaid.
                </button>
                <div class="h-6 w-px bg-gray-200"></div>
                <div>
                    <h1 class="text-sm font-semibold text-gray-900">
                        Welcome back, {{ userName }}
                    </h1>
                    <p class="text-xs text-gray-500">{{ currentDate }}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <button
                    type="button"
                    class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </header>
</template>
