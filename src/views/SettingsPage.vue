<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "../api/auth";
import { teamsApi, rolesApi, teamMembersApi, type Team, type Role } from "../api/teams-api";
import { useUser } from "../composables/useUser";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import IntegrationsCard from "../components/settings/IntegrationsCard.vue";

const router = useRouter();
const { profile, isAdmin, refresh: refreshProfile } = useUser();

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
  router.push("/login");
}

const allTeams = ref<Team[]>([]);
const allRoles = ref<Role[]>([]);
const teamsLoading = ref(false);
const rolesLoading = ref(false);

const joinTeamId = ref("");

async function loadTeams() {
  teamsLoading.value = true;
  try {
    allTeams.value = await teamsApi.list();
  } catch {
    // silently fail
  } finally {
    teamsLoading.value = false;
  }
}

async function loadRoles() {
  rolesLoading.value = true;
  try {
    allRoles.value = await rolesApi.list();
  } catch {
    // silently fail
  } finally {
    rolesLoading.value = false;
  }
}

const joinableTeams = computed(() => {
  const memberTeamIds = new Set(profile.value?.teams.map(t => t.id) ?? []);
  return allTeams.value.filter(t => !memberTeamIds.has(t.id));
});

const joinRoleIds = ref<string[]>([]);

const joinTeamRoles = computed(() => {
  if (!joinTeamId.value) return [];
  return allRoles.value.filter(r => r.teamId === joinTeamId.value);
});

function toggleJoinRole(roleId: string, checked: boolean) {
  if (checked) {
    if (!joinRoleIds.value.includes(roleId)) joinRoleIds.value = [...joinRoleIds.value, roleId];
  } else {
    joinRoleIds.value = joinRoleIds.value.filter(id => id !== roleId);
  }
}

watch(joinTeamId, () => {
  joinRoleIds.value = [];
});

async function joinTeam() {
  if (!joinTeamId.value || !profile.value) return;
  try {
    await teamMembersApi.joinOwn(joinTeamId.value, { roleIds: joinRoleIds.value });
    joinTeamId.value = "";
    joinRoleIds.value = [];
    await refreshProfile();
  } catch {
    // silently fail
  }
}

async function leaveTeam(teamId: string) {
  if (!profile.value) return;
  try {
    await teamMembersApi.leave(teamId);
    await refreshProfile();
  } catch {
    // silently fail
  }
}

const updatingRoles = ref<Set<string>>(new Set());

function teamRoles(teamId: string): Role[] {
  return allRoles.value.filter(r => r.teamId === teamId);
}

function selectedRoleIds(teamId: string): string[] {
  const team = profile.value?.teams.find(t => t.id === teamId);
  if (!team) return [];
  const names = new Set(team.roles);
  return allRoles.value
    .filter(r => r.teamId === teamId && names.has(r.name))
    .map(r => r.id);
}

function isRoleSelected(teamId: string, roleId: string): boolean {
  return selectedRoleIds(teamId).includes(roleId);
}

async function updateRoles(teamId: string, roleId: string, checked: boolean) {
  if (!profile.value) return;
  updatingRoles.value.add(teamId);

  const current = selectedRoleIds(teamId);
  const newRoleIds = checked
    ? [...current, roleId]
    : current.filter(id => id !== roleId);

  try {
    await teamMembersApi.updateOwn(teamId, { roleIds: newRoleIds });
    await refreshProfile();
  } catch {
    // silently fail
  } finally {
    updatingRoles.value.delete(teamId);
  }
}

onMounted(() => {
  loadTeams();
  loadRoles();
});
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

    <div v-if="!isAdmin" class="mt-6 bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900">Teams & Roles</h2>
      <p class="text-sm text-gray-500 mt-1">
        Your team memberships and roles across the organization.
      </p>

      <!-- Current Memberships -->
      <div v-if="profile?.teams.length" class="mt-4 space-y-3">
        <div
          v-for="team in profile.teams"
          :key="team.id"
          class="flex items-center justify-between p-3 rounded-lg border border-gray-100"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ team.name }}</p>
            <div v-if="teamRoles(team.id).length" class="flex flex-wrap gap-1.5 mt-1.5">
              <label
                v-for="role in teamRoles(team.id)"
                :key="role.id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer select-none"
                :class="isRoleSelected(team.id, role.id)
                  ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                  : 'bg-stone-50 text-stone-500 ring-1 ring-stone-200 hover:bg-stone-100'"
              >
                <input
                  type="checkbox"
                  :checked="isRoleSelected(team.id, role.id)"
                  :disabled="updatingRoles.has(team.id)"
                  class="sr-only"
                  @change="(e: Event) => updateRoles(team.id, role.id, (e.target as HTMLInputElement).checked)"
                />
                {{ role.name }}
              </label>
            </div>
            <p v-else-if="rolesLoading" class="text-xs text-gray-400 mt-1">Loading roles...</p>
            <p v-else class="text-xs text-gray-400 mt-1">No roles available for this team</p>
          </div>
          <button
            type="button"
            class="text-xs font-medium text-red-500 hover:text-red-700 hover:underline cursor-pointer whitespace-nowrap"
            @click="leaveTeam(team.id)"
          >
            Leave Team
          </button>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-gray-400">
        You are not a member of any team yet.
      </p>

      <!-- Join Team -->
      <div class="mt-4 flex items-center gap-3">
        <select
          v-model="joinTeamId"
          class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/20 focus:border-[#FF8C4B]"
          :disabled="teamsLoading || !joinableTeams.length"
        >
          <option value="" disabled>Select a team…</option>
          <option v-for="team in joinableTeams" :key="team.id" :value="team.id">
            {{ team.name }} ({{ team._count.members }} members)
          </option>
        </select>
        <button
          type="button"
          :disabled="!joinTeamId"
          class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#F27D3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          @click="joinTeam"
        >
          Join Team
        </button>
      </div>

      <div v-if="joinTeamId" class="mt-3">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Select your roles (optional)</p>
        <div v-if="joinTeamRoles.length" class="mt-2 flex flex-wrap gap-2">
          <label
            v-for="role in joinTeamRoles"
            :key="role.id"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 cursor-pointer hover:border-[#FF8C4B]/40"
          >
            <input
              type="checkbox"
              :checked="joinRoleIds.includes(role.id)"
              @change="toggleJoinRole(role.id, ($event.target as HTMLInputElement).checked)"
              class="rounded border-gray-300 text-[#FF8C4B] focus:ring-[#FF8C4B]"
            />
            {{ role.name }}
          </label>
        </div>
        <p v-else class="mt-2 text-sm text-gray-400">This team has no roles yet.</p>
      </div>
    </div>

    <IntegrationsCard v-if="!isAdmin" class="mt-6" />

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
