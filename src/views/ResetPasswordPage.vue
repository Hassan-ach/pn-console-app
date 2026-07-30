<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authApi } from "../api/auth";
import AlertBanner from "../components/AlertBanner.vue";

const route = useRoute();
const router = useRouter();
const token = route.query.token as string | undefined;

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const success = ref(false);

const fieldErrors = ref({ password: "", confirmPassword: "" });
const touched = ref({ password: false, confirmPassword: false });

const invalidLink = computed(() => !token);

function validateField(field: "password" | "confirmPassword") {
  touched.value[field] = true;
  switch (field) {
    case "password":
      if (!password.value) {
        fieldErrors.value.password = "Please enter a new password";
      } else if (password.value.length < 8) {
        fieldErrors.value.password = "Password must be at least 8 characters";
      } else {
        fieldErrors.value.password = "";
      }
      break;
    case "confirmPassword":
      if (!confirmPassword.value) {
        fieldErrors.value.confirmPassword = "Please confirm your password";
      } else if (confirmPassword.value !== password.value) {
        fieldErrors.value.confirmPassword = "Passwords do not match";
      } else {
        fieldErrors.value.confirmPassword = "";
      }
      break;
  }
}

function validate(): boolean {
  let valid = true;
  fieldErrors.value = { password: "", confirmPassword: "" };

  if (!password.value) {
    fieldErrors.value.password = "Please enter a new password";
    valid = false;
  } else if (password.value.length < 8) {
    fieldErrors.value.password = "Password must be at least 8 characters";
    valid = false;
  }
  if (!confirmPassword.value) {
    fieldErrors.value.confirmPassword = "Please confirm your password";
    valid = false;
  } else if (confirmPassword.value !== password.value) {
    fieldErrors.value.confirmPassword = "Passwords do not match";
    valid = false;
  }

  return valid;
}

async function handleResetPassword() {
  error.value = "";
  touched.value = { password: true, confirmPassword: true };
  if (!validate()) return;
  if (!token) return;

  loading.value = true;
  try {
    const res = await authApi.resetPassword({
      token,
      password: password.value,
    });
    sessionStorage.setItem("access_token", res.access_token);
    success.value = true;
    setTimeout(() => {
      router.push("/home");
    }, 2000);
  } catch (e: any) {
    error.value = e.message ?? "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen bg-[#FCFAF8]">
    <section
      class="hidden lg:flex w-1/2 relative overflow-hidden bg-[#FF9454] items-center justify-center"
    >
      <div
        class="absolute w-[600px] h-[600px] bg-[#FFA770] rounded-full -top-[200px] -right-[100px] opacity-40"
      ></div>
      <div
        class="absolute w-[900px] h-[900px] bg-[#FA8742] rounded-full top-[25%] -left-[350px]"
      ></div>
      <h1
        class="text-5xl font-bold text-white tracking-tight relative z-10 -ml-12"
      >
        mosaid.
      </h1>
    </section>

    <section class="w-full lg:w-1/2 flex items-center justify-center p-8">
      <div class="w-full max-w-[420px]">
        <template v-if="invalidLink">
          <div class="text-center">
            <div
              class="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Invalid reset link</h1>
            <p class="text-gray-500 mt-2 text-sm">
              This reset link is invalid or missing a token. Please request a
              new one.
            </p>
            <p class="text-center text-[13px] text-gray-500 mt-6">
              <router-link
                to="/forgot-password"
                class="text-[#FF8C4B] hover:text-[#F27D3A] font-bold cursor-pointer"
                >Request a new reset link</router-link
              >
            </p>
          </div>
        </template>

        <template v-else-if="!success">
          <h1 class="text-3xl font-bold text-gray-900">
            Create a new password
          </h1>
          <p class="text-gray-500 mt-2 text-sm">
            Enter your new password below.
          </p>

          <form @submit.prevent="handleResetPassword" class="space-y-5 mt-8">
            <div>
              <label
                for="password"
                class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
                >New Password <span class="text-red-500">*</span></label
              >
              <input
                id="password"
                v-model="password"
                @input="validateField('password')"
                required
                type="password"
                placeholder="Min. 8 characters"
                class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
              />
              <p v-if="fieldErrors.password" class="text-red-500 text-xs mt-1">
                {{ fieldErrors.password }}
              </p>
            </div>
            <div>
              <label
                for="confirmPassword"
                class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
                >Confirm Password <span class="text-red-500">*</span></label
              >
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                @input="validateField('confirmPassword')"
                required
                type="password"
                placeholder="Re-enter your password"
                class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
              />
              <p
                v-if="fieldErrors.confirmPassword"
                class="text-red-500 text-xs mt-1"
              >
                {{ fieldErrors.confirmPassword }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full mt-2 py-3.5 px-4 bg-[#FF8C4B] hover:bg-[#F27D3A] text-white font-semibold rounded-lg shadow-[0_4px_14px_0_rgba(255,140,75,0.39)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ loading ? "Resetting..." : "Reset Password" }}
            </button>
          </form>

          <AlertBanner type="error" :message="error" @dismiss="error = ''" />

          <p class="text-center text-[13px] text-gray-500 mt-6">
            <router-link
              to="/login"
              class="text-[#FF8C4B] hover:text-[#F27D3A] font-bold cursor-pointer"
              >&larr; Back to login</router-link
            >
          </p>
        </template>

        <template v-else>
          <div class="text-center">
            <div
              class="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Password updated!</h1>
            <p class="text-gray-500 mt-2 text-sm">
              Your password has been changed successfully.
            </p>
            <p class="text-gray-400 mt-4 text-xs">
              Redirecting to dashboard...
            </p>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
