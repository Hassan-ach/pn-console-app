<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import DemoPage from "./demo/DemoPage.vue";
import SignupPage from "./views/SignupPage.vue";

const page = ref("telegram");

function onHashChange() {
  page.value = window.location.hash.replace("#", "") || "telegram";
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
  <DemoPage v-if="page === 'telegram'" />
  <SignupPage v-else-if="page === 'signup'" />
</template>
