<script setup lang="ts">
import { ref, reactive, inject, watch, onMounted, onUnmounted } from "vue";
import { authApi } from "../api/auth";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const created = ref(false);
const error = ref("");

const oauthToken = inject<ReturnType<typeof ref<string | null>>>("oauthToken", ref(null));

watch(oauthToken, (token) => {
  if (token) {
    loading.value = false;
    created.value = true;
  }
}, { immediate: true });

onMounted(() => {
  const flag = sessionStorage.getItem("google_signup_success");
  if (flag) {
    sessionStorage.removeItem("google_signup_success");
    created.value = true;
    loading.value = false;
  }
});

const fieldErrors = reactive({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
});

const touched = reactive({
  firstName: false,
  lastName: false,
  email: false,
  password: false,
});

function validateField(field: keyof typeof fieldErrors) {
  touched[field] = true;
  switch (field) {
    case "firstName": {
      const v = firstName.value.trim();
      if (!v) {
        fieldErrors.firstName = "Please enter your first name";
      } else if (v.length < 3) {
        fieldErrors.firstName = "First name must be at least 3 characters";
      } else if (v.length > 20) {
        fieldErrors.firstName = "First name must be at most 20 characters";
      } else {
        fieldErrors.firstName = "";
      }
      break;
    }
    case "lastName": {
      const v = lastName.value.trim();
      if (!v) {
        fieldErrors.lastName = "Please enter your last name";
      } else if (v.length < 3) {
        fieldErrors.lastName = "Last name must be at least 3 characters";
      } else if (v.length > 20) {
        fieldErrors.lastName = "Last name must be at most 20 characters";
      } else {
        fieldErrors.lastName = "";
      }
      break;
    }
    case "email":
      if (!email.value.trim()) {
        fieldErrors.email = "Please enter your email address";
      } else if (!/\S+@\S+\.\S+/.test(email.value)) {
        fieldErrors.email = "That doesn't look like a valid email";
      } else {
        fieldErrors.email = "";
      }
      break;
    case "password":
      if (!password.value) {
        fieldErrors.password = "Please create a password";
      } else if (password.value.length < 8) {
        fieldErrors.password = "Password must be at least 8 characters";
      } else {
        fieldErrors.password = "";
      }
      break;
  }
}

function validate(): boolean {
  let valid = true;
  fieldErrors.firstName = "";
  fieldErrors.lastName = "";
  fieldErrors.email = "";
  fieldErrors.password = "";

  const fn = firstName.value.trim();
  if (!fn) {
    fieldErrors.firstName = "Please enter your first name";
    valid = false;
  } else if (fn.length < 3) {
    fieldErrors.firstName = "First name must be at least 3 characters";
    valid = false;
  } else if (fn.length > 20) {
    fieldErrors.firstName = "First name must be at most 20 characters";
    valid = false;
  }
  const ln = lastName.value.trim();
  if (!ln) {
    fieldErrors.lastName = "Please enter your last name";
    valid = false;
  } else if (ln.length < 3) {
    fieldErrors.lastName = "Last name must be at least 3 characters";
    valid = false;
  } else if (ln.length > 20) {
    fieldErrors.lastName = "Last name must be at most 20 characters";
    valid = false;
  }
  if (!email.value.trim()) {
    fieldErrors.email = "Please enter your email address";
    valid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    fieldErrors.email = "That doesn't look like a valid email";
    valid = false;
  }
  if (!password.value) {
    fieldErrors.password = "Please create a password";
    valid = false;
  } else if (password.value.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters";
    valid = false;
  }

  return valid;
}

let googlePoll: ReturnType<typeof setInterval> | null = null;
let oauthPopup: Window | null = null;

onUnmounted(() => {
  if (googlePoll) clearInterval(googlePoll);
});

function pollOauthResult() {
  const flag = sessionStorage.getItem("google_signup_success");
  if (flag) {
    sessionStorage.removeItem("google_signup_success");
    if (googlePoll) clearInterval(googlePoll);
    loading.value = false;
    created.value = true;
    return;
  }
  if (oauthPopup && oauthPopup.closed) {
    if (googlePoll) clearInterval(googlePoll);
    loading.value = false;
  }
}

async function signInWithOauth(baseAuthUrl: string, windowName: string, _provider: string) {
  loading.value = true;

  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_oauth_window", { url: `${baseAuthUrl}?mode=desktop` });
  } else {
    oauthPopup = window.open(baseAuthUrl, windowName, "width=600,height=700");
    if (!oauthPopup) {
      window.location.href = baseAuthUrl;
      return;
    }
    googlePoll = setInterval(pollOauthResult, 300);
  }
}

function signInWithGoogle() {
  const baseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace("/api", "");
  signInWithOauth(`${baseUrl}/api/auth/google`, "google-auth", "Google");
}

function signInWithMicrosoft() {
  const baseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace("/api", "");
  signInWithOauth(`${baseUrl}/api/auth/microsoft`, "microsoft-auth", "Microsoft");
}

function signInWithSso() {
  const baseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace("/api", "");
  signInWithOauth(`${baseUrl}/api/auth/sso`, "sso-auth", "SSO");
}

async function handleSignup() {
  error.value = "";
  (Object.keys(touched) as (keyof typeof touched)[]).forEach(k => { touched[k] = true; });
  if (!validate()) return;

  loading.value = true;

  try {
    await authApi.signup({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
    });
    created.value = true;
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
      <!-- Decorative circles -->
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
        <template v-if="!created">
          <h1 class="text-3xl font-bold text-gray-900">Create your account</h1>
          <p class="text-gray-500 mt-2 text-sm">
            Get started — it only takes a minute.
          </p>

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
            or with email
          </div>
          <form @submit.prevent="handleSignup" class="space-y-5">
            <div class="flex gap-4">
              <div class="flex-1">
                <label
                  for="firstName"
                  class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
                  >First Name <span class="text-red-500">*</span></label
                >
                <input
                  id="firstName"
                  v-model="firstName"
                  @input="validateField('firstName')"
                  required
                  type="text"
                  placeholder="Sarah"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
                />
                <p
                  v-if="fieldErrors.firstName"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ fieldErrors.firstName }}
                </p>
              </div>
              <div class="flex-1">
                <label
                  for="lastName"
                  class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
                  >Last Name <span class="text-red-500">*</span></label
                >
                <input
                  id="lastName"
                  v-model="lastName"
                  @input="validateField('lastName')"
                  required
                  type="text"
                  placeholder="Mitchell"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
                />
                <p
                  v-if="fieldErrors.lastName"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ fieldErrors.lastName }}
                </p>
              </div>
            </div>
            <div>
              <label
                for="email"
                  class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
                  >Company Email <span class="text-red-500">*</span></label
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
                <p
                  v-if="fieldErrors.email"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ fieldErrors.email }}
                </p>
            </div>
            <div>
              <label
                for="password"
                  class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide"
                  >Password <span class="text-red-500">*</span></label
                >
                <input
                  id="password"
                  v-model="password"
                  @input="validateField('password')"
                  required
                  type="password"
                  placeholder="Create a strong password"
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
                />
                <p
                  v-if="fieldErrors.password"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ fieldErrors.password }}
                </p>
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full mt-2 py-3.5 px-4 bg-[#FF8C4B] hover:bg-[#F27D3A] text-white font-semibold rounded-lg shadow-[0_4px_14px_0_rgba(255,140,75,0.39)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Create Account
            </button>
          </form>

          <div class="text-center mt-6">
            <a
              href="#"
              @click.prevent="signInWithSso"
              class="text-[13px] text-[#FF8C4B] hover:text-[#F27D3A] font-medium cursor-pointer"
              >Sign up via company SSO &rarr;</a
            >
          </div>

          <p class="text-center text-[13px] text-gray-500 mt-6">
            Already have an account?
            <a href="#" class="text-[#FF8C4B] hover:text-[#F27D3A] font-bold cursor-pointer"
              >Log in</a
            >
          </p>

          <p
            v-if="error"
            class="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
          >
            {{ error }}
          </p>
        </template>

        <div v-else class="text-center py-12">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mt-6">Account created!</h2>
          <p class="text-gray-500 mt-2">Welcome aboard. Your account is ready.</p>
          <a
            href="#telegram"
            class="inline-block mt-8 py-3 px-6 bg-[#FF8C4B] hover:bg-[#F27D3A] text-white font-semibold rounded-lg shadow-[0_4px_14px_0_rgba(255,140,75,0.39)] transition-all cursor-pointer"
          >
            Go to Telegram Demo
          </a>
        </div>
      </div>
    </section>
  </main>


</template>
