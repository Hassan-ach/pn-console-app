<script setup lang="ts">
import { ref } from "vue";
import { authApi } from "../api/auth";

const fullName = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const result = ref<{
  access_token: string;
  user: { firstName: string; lastName: string; email: string };
} | null>(null);
const error = ref("");

function splitFullName(name: string): { firstName: string; lastName: string } {
  const spaceIndex = name.indexOf(" ");
  if (spaceIndex === -1) return { firstName: name, lastName: "" };
  return {
    firstName: name.slice(0, spaceIndex),
    lastName: name.slice(spaceIndex + 1),
  };
}

async function handleSignup() {
  if (!fullName.value || !email.value || !password.value) {
    error.value = "Please fill in all fields.";
    return;
  }
  loading.value = true;
  error.value = "";
  result.value = null;

  const { firstName, lastName } = splitFullName(fullName.value);

  try {
    const res = await authApi.signup({
      firstName,
      lastName,
      email: email.value,
      password: password.value,
    });
    result.value = res;
    localStorage.setItem("access_token", res.access_token);
  } catch (e: any) {
    error.value = e.message ?? "Something went wrong.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen bg-[#FCFAF8]">
    <section class="hidden lg:flex w-1/2 relative overflow-hidden bg-[#FF9454] items-center justify-center">
      <!-- Decorative circles -->
      <div class="absolute w-[600px] h-[600px] bg-[#FFA770] rounded-full -top-[200px] -right-[100px] opacity-40"></div>
      <div class="absolute w-[900px] h-[900px] bg-[#FA8742] rounded-full top-[25%] -left-[350px]"></div>
      
      <h1 class="text-5xl font-bold text-white tracking-tight relative z-10 -ml-12">mosaid.</h1>
    </section>

    <section class="w-full lg:w-1/2 flex items-center justify-center p-8">
      <div class="w-full max-w-[420px]">
        <h1 class="text-3xl font-bold text-gray-900">Create your account</h1>
        <p class="text-gray-500 mt-2 text-sm">Get started — it only takes a minute.</p>

        <div class="flex gap-4 mt-8">
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span class="text-red-500 font-bold text-sm leading-none">G</span>
            <span>Google</span>
          </button>
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span class="bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-sm font-bold">M</span>
            <span>Microsoft</span>
          </button>
        </div>

        <div class="flex items-center gap-4 my-8 text-gray-300 text-xs before:flex-1 before:h-px before:bg-gray-200 after:flex-1 after:h-px after:bg-gray-200">
          or with email
        </div>

        <form @submit.prevent="handleSignup" class="space-y-5">
          <div>
            <label for="fullName" class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Full Name</label>
            <input
              id="fullName"
              v-model="fullName"
              type="text"
              placeholder="Sarah Mitchell"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
            />
          </div>
          <div>
            <label for="email" class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Company Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="sarah@company.com"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
            />
          </div>
          <div>
            <label for="password" class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Create a strong password"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#FF8C4B] focus:ring-2 focus:ring-[#FF8C4B]/20 shadow-sm transition-all bg-white"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 py-3.5 px-4 bg-[#FF8C4B] hover:bg-[#F27D3A] text-white font-semibold rounded-lg shadow-[0_4px_14px_0_rgba(255,140,75,0.39)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
        </form>

        <div class="text-center mt-6">
          <a href="#" class="text-[13px] text-[#FF8C4B] hover:text-[#F27D3A] font-medium">Sign up via company SSO &rarr;</a>
        </div>

        <p class="text-center text-[13px] text-gray-500 mt-6">
          Already have an account?
          <a href="#" class="text-[#FF8C4B] hover:text-[#F27D3A] font-bold">Log in</a>
        </p>

        <p v-if="error" class="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {{ error }}
        </p>

        <div v-if="result" class="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm break-all">
          <p>
            Signed in as
            <strong>{{ result.user.firstName }} {{ result.user.lastName }}</strong>
          </p>
          <p class="mt-1 text-xs opacity-75">{{ result.access_token }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
