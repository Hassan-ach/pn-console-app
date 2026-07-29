<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "../api/auth";

const router = useRouter();

const email = ref("");
const loading = ref(false);
const error = ref("");
const sent = ref(false);
const polling = ref(false);

const fieldErrors = ref({ email: "" });
const touched = ref({ email: false });

let pollTimer: ReturnType<typeof setInterval> | null = null;

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

function validateField(field: "email") {
  touched.value[field] = true;
  if (!email.value.trim()) {
    fieldErrors.value.email = "Please enter your email address";
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    fieldErrors.value.email = "That doesn't look like a valid email";
  } else {
    fieldErrors.value.email = "";
  }
}

function validate(): boolean {
  if (!email.value.trim()) {
    fieldErrors.value.email = "Please enter your email address";
    return false;
  }
  if (!/\S+@\S+\.\S+/.test(email.value)) {
    fieldErrors.value.email = "That doesn't look like a valid email";
    return false;
  }
  fieldErrors.value.email = "";
  return true;
}

async function handleForgotPassword() {
  error.value = "";
  touched.value = { email: true };
  if (!validate()) return;

  loading.value = true;
  try {
    await authApi.forgotPassword({
      email: email.value.toLowerCase().trim(),
    });
    sent.value = true;
    startPolling();
  } catch (e: any) {
    error.value = e.message ?? "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
}

function startPolling() {
  polling.value = true;
  pollTimer = setInterval(async () => {
    try {
      const res = await authApi.getPendingReset(
        email.value.toLowerCase().trim(),
      );
      if (res.token) {
        if (pollTimer) clearInterval(pollTimer);
        router.push({ name: 'reset-password', query: { token: res.token } });
      }
    } catch {
      // ignore polling errors, keep trying
    }
  }, 2000);
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
        <template v-if="!sent">
          <h1 class="text-3xl font-bold text-gray-900">Reset your password</h1>
          <p class="text-gray-500 mt-2 text-sm">
            Enter your email and we'll send you a reset link.
          </p>

          <form @submit.prevent="handleForgotPassword" class="space-y-5 mt-8">
            <div>
              <label
                for="email"
                class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
                >Email <span class="text-red-500">*</span></label
              >
              <input
                id="email"
                v-model="email"
                @input="validateField('email')"
                required
                type="email"
                placeholder="sarah@company.com"
                class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
              />
              <p v-if="fieldErrors.email" class="text-red-500 text-xs mt-1">
                {{ fieldErrors.email }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full mt-2 py-3.5 px-4 bg-[#FF8C4B] hover:bg-[#F27D3A] text-white font-semibold rounded-lg shadow-[0_4px_14px_0_rgba(255,140,75,0.39)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ loading ? "Sending..." : "Send Reset Link" }}
            </button>
          </form>

          <p
            v-if="error"
            class="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
          >
            {{ error }}
          </p>

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
            <h1 class="text-3xl font-bold text-gray-900">Check your email</h1>
            <p class="text-gray-500 mt-2 text-sm">
              We've sent a reset link to
              <strong>{{ email }}</strong
              >. Click the link in the email to continue.
            </p>
            <p v-if="polling" class="text-gray-400 mt-4 text-xs">
              Waiting for confirmation... You can close this tab after clicking
              the link.
            </p>
            <p class="text-center text-[13px] text-gray-500 mt-6">
              <router-link
                to="/login"
                class="text-[#FF8C4B] hover:text-[#F27D3A] font-bold cursor-pointer"
                >&larr; Back to login</router-link
              >
            </p>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
