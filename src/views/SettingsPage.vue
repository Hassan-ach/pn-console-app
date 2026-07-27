<script setup lang="ts">
import { ref } from "vue";
import { authApi } from "../api/auth";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import IntegrationsCard from "../components/settings/IntegrationsCard.vue";

const showLogoutDialog = ref(false);
const loggingOut = ref(false);

async function confirmLogout() {
  loggingOut.value = true;
  try {
    await authApi.logout();
  } catch {
    // Fire-and-forget — proceed with client-side logout regardless
  }
  sessionStorage.removeItem("access_token");
  window.location.hash = "#login";
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
    <p class="text-gray-500 mt-2">Manage your account and billing.</p>

    <div class="mt-10 bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900">Account</h2>
      <p class="text-sm text-gray-500 mt-1">
        Sign out of your account on this device.
      </p>
      <button
        type="button"
        class="mt-4 px-5 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        @click="showLogoutDialog = true"
      >
        Log Out
      </button>
    </div>

    <IntegrationsCard class="mt-6" />

    <ConfirmDialog
      :open="showLogoutDialog"
      title="Log out of Mosaid?"
      message="You'll be signed out of your account and returned to the login screen. Your data will remain safe and intact."
      confirm-label="Log Out"
      cancel-label="Cancel"
      :disabled="loggingOut"
      @confirm="confirmLogout"
      @cancel="showLogoutDialog = false"
    />
  </div>
</template>
