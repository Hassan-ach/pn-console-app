<script setup lang="ts">
import SideNavBar from '../components/SideNavBar.vue';
import PageHeader from '../components/PageHeader.vue';
</script>

<template>
    <div class="min-h-screen bg-[#FCFAF8]">
        <PageHeader />
        <div class="flex">
            <SideNavBar />
            <main class="flex-1 p-8 min-w-0">
                <router-view />
            </main>
        </div>
    </div>
</template>
