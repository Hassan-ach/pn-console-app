<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "../api/auth";
import AlertBanner from "../components/AlertBanner.vue";

const router = useRouter();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

const fieldErrors = ref({ email: "", password: "" });
const touched = ref({ email: false, password: false });

function validateField(field: "email" | "password") {
  touched.value[field] = true;
  switch (field) {
    case "email":
      if (!email.value.trim()) {
        fieldErrors.value.email = "Please enter your email address";
      } else if (!/\S+@\S+\.\S+/.test(email.value)) {
        fieldErrors.value.email = "That doesn't look like a valid email";
      } else {
        fieldErrors.value.email = "";
      }
      break;
    case "password":
      if (!password.value) {
        fieldErrors.value.password = "Please enter your password";
      } else {
        fieldErrors.value.password = "";
      }
      break;
  }
}

function validate(): boolean {
  let valid = true;
  fieldErrors.value = { email: "", password: "" };

  if (!email.value.trim()) {
    fieldErrors.value.email = "Please enter your email address";
    valid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    fieldErrors.value.email = "That doesn't look like a valid email";
    valid = false;
  }
  if (!password.value) {
    fieldErrors.value.password = "Please enter your password";
    valid = false;
  }

  return valid;
}

let googlePoll: ReturnType<typeof setInterval> | null = null;
let oauthPopup: Window | null = null;
let oauthTauriWindow: any = null;

onUnmounted(() => {
  if (googlePoll) clearInterval(googlePoll);
});

function cancelOauth() {
  if (oauthTauriWindow) {
    oauthTauriWindow.close();
    oauthTauriWindow = null;
  } else if (oauthPopup) {
    oauthPopup.close();
    oauthPopup = null;
  }
  if (googlePoll) {
    clearInterval(googlePoll);
    googlePoll = null;
  }
  loading.value = false;
}

function pollOauthResult() {
  if (oauthPopup && oauthPopup.closed) {
    if (googlePoll) clearInterval(googlePoll);
    loading.value = false;
    if (!sessionStorage.getItem("access_token")) {
      error.value = "Authentication was cancelled. Please try again.";
    }
  }
}

function baseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace(
    "/api",
    "",
  );
}

async function openOauthWindow(url: string, name: string) {
  let isTauri = false;
  try {
    await import("@tauri-apps/api/event");
    isTauri = true;
  } catch {}

  if (isTauri) {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    oauthTauriWindow = new WebviewWindow(name, {
      url,
      title:
        name === "sso-auth"
          ? "Company SSO"
          : name === "microsoft-auth"
            ? "Microsoft Login"
            : "Google Login",
      width: 600,
      height: 700,
      center: true,
    });
    oauthTauriWindow.once("tauri://error", (e: any) => {
      console.error("WebviewWindow error:", e);
      error.value = "Failed to open authentication window. Please try again.";
      loading.value = false;
      oauthTauriWindow = null;
    });
    await oauthTauriWindow.onCloseRequested(() => {
      loading.value = false;
      oauthTauriWindow = null;
    });
    loading.value = true;
  } else {
    oauthPopup = window.open(url, name, "width=600,height=700");
    if (!oauthPopup) {
      window.location.href = url;
      return;
    }
    loading.value = true;
    googlePoll = setInterval(pollOauthResult, 300);
  }
}

function signInWithGoogle() {
  openOauthWindow(`${baseUrl()}/api/auth/google`, "google-auth");
}

function signInWithMicrosoft() {
  openOauthWindow(`${baseUrl()}/api/auth/microsoft`, "microsoft-auth");
}

function signInWithSso() {
  openOauthWindow(`${baseUrl()}/api/auth/sso`, "sso-auth");
}

async function handleLogin() {
  error.value = "";
  touched.value = { email: true, password: true };
  if (!validate()) return;

  loading.value = true;

  try {
    const res = await authApi.login({
      email: email.value.toLowerCase().trim(),
      password: password.value,
    });
    sessionStorage.setItem("access_token", res.access_token);
    router.push("/home");
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
        <h1 class="text-3xl font-bold text-gray-900">Welcome back</h1>
        <p class="text-gray-500 mt-2 text-sm">Log in to your account.</p>

        <div class="flex gap-4 mt-8">
          <button
            type="button"
            @click="signInWithGoogle"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span class="text-red-500 font-bold text-sm leading-none">G</span>
            <span>Google</span>
          </button>
          <button
            type="button"
            @click="signInWithMicrosoft"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span
              class="bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-sm font-bold"
              >M</span
            >
            <span>Microsoft</span>
          </button>
        </div>

        <div
          class="flex items-center gap-4 my-8 text-gray-300 text-xs before:flex-1 before:h-px before:bg-gray-200 after:flex-1 after:h-px after:bg-gray-200"
        >
          or continue with email
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
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
          <div>
            <label
              for="password"
              class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
              >Password <span class="text-red-500">*</span></label
            >
            <div class="relative">
              <input
                id="password"
                v-model="password"
                @input="validateField('password')"
                required
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                class="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none p-0"
              >
                <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <p v-if="fieldErrors.password" class="text-red-500 text-xs mt-1">
              {{ fieldErrors.password }}
            </p>
          </div>

          <div class="flex items-center justify-between">
            <router-link
              to="/forgot-password"
              class="text-[13px] text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
              >Forgot password?</router-link
            >
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 py-3.5 px-4 bg-[#FF8C4B] hover:bg-[#F27D3A] text-white font-semibold rounded-lg shadow-[0_4px_14px_0_rgba(255,140,75,0.39)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Log In
          </button>
        </form>

        <div class="text-center mt-6">
          <a
            href="#"
            @click.prevent="signInWithSso"
            class="text-[13px] text-[#FF8C4B] hover:text-[#F27D3A] font-medium cursor-pointer"
            >Sign in via company SSO &rarr;</a
          >
        </div>

        <p class="text-center text-[13px] text-gray-500 mt-6">
          Don't have an account?
          <router-link
            to="/signup"
            class="text-[#FF8C4B] hover:text-[#F27D3A] font-bold cursor-pointer"
            >Sign up</router-link
          >
        </p>

        <AlertBanner type="error" :message="error" @dismiss="error = ''" />
      </div>
    </section>

    <div
      v-if="loading"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4 min-w-[300px]"
      >
        <div
          class="w-8 h-8 border-4 border-[#FF8C4B] border-t-transparent rounded-full animate-spin"
        />
        <p class="text-gray-700 font-medium">Connecting...</p>
        <button
          @click="cancelOauth"
          class="mt-2 px-6 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  </main>
</template>
