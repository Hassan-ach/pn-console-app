<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { teamsApi, rolesApi, type Team, type Role } from "../../api/teams-api";
import ConfirmDialog from "../ConfirmDialog.vue";

const allTeams = ref<Team[]>([]);
const teamsLoading = ref(false);

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

const allRoles = ref<Role[]>([]);
const rolesLoading = ref(false);

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

const deletingTeam = ref<Team | null>(null);
const teamDeleteLoading = ref(false);

const deleteTeamMessage = computed(() =>
  `This will permanently delete "${deletingTeam.value?.name ?? ''}" and cascade to its members and roles. This cannot be undone.`,
);

async function confirmDeleteTeam() {
  if (!deletingTeam.value) return;
  teamDeleteLoading.value = true;
  try {
    await teamsApi.remove(deletingTeam.value.id);
    await Promise.all([loadTeams(), loadRoles()]);
  } catch {
    // silently fail
  } finally {
    teamDeleteLoading.value = false;
    deletingTeam.value = null;
  }
}

const deletingRole = ref<Role | null>(null);
const roleDeleteLoading = ref(false);

const deleteRoleMessage = computed(() =>
  `This will permanently delete the role "${deletingRole.value?.name ?? ''}" and remove its assignments. This cannot be undone.`,
);

function teamName(teamId: string): string {
  return allTeams.value.find(t => t.id === teamId)?.name ?? 'Unknown team';
}

async function confirmDeleteRole() {
  if (!deletingRole.value) return;
  roleDeleteLoading.value = true;
  try {
    await rolesApi.remove(deletingRole.value.id);
    await loadRoles();
  } catch {
    // silently fail
  } finally {
    roleDeleteLoading.value = false;
    deletingRole.value = null;
  }
}

const newTeamName = ref("");
const newTeamDesc = ref("");
const creatingTeam = ref(false);

async function createTeam() {
  if (!newTeamName.value.trim()) return;
  creatingTeam.value = true;
  try {
    await teamsApi.create({ name: newTeamName.value.trim(), description: newTeamDesc.value.trim() || undefined });
    newTeamName.value = "";
    newTeamDesc.value = "";
    await loadTeams();
  } catch {
    // silently fail
  } finally {
    creatingTeam.value = false;
  }
}

const newRoleName = ref("");
const newRoleDesc = ref("");
const newRoleTeamId = ref("");
const creatingRole = ref(false);

async function createRole() {
  if (!newRoleName.value.trim() || !newRoleTeamId.value) return;
  creatingRole.value = true;
  try {
    await rolesApi.create({
      name: newRoleName.value.trim(),
      teamId: newRoleTeamId.value,
      description: newRoleDesc.value.trim() || undefined,
    });
    newRoleName.value = "";
    newRoleDesc.value = "";
    newRoleTeamId.value = "";
  } catch {
    // silently fail
  } finally {
    creatingRole.value = false;
  }
}

onMounted(() => {
  loadTeams();
  loadRoles();
});
</script>

<template>
  <div>
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900">Create Team</h2>
      <p class="text-sm text-gray-500 mt-1">Add a new team to the organization.</p>
      <div class="mt-4 flex flex-col sm:flex-row gap-3">
        <input
          v-model="newTeamName"
          placeholder="Team name"
          class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/20 focus:border-[#FF8C4B]"
        />
        <input
          v-model="newTeamDesc"
          placeholder="Description (optional)"
          class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/20 focus:border-[#FF8C4B]"
        />
        <button
          type="button"
          :disabled="!newTeamName.trim() || creatingTeam"
          class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#F27D3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
          @click="createTeam"
        >
          {{ creatingTeam ? 'Creating…' : 'Create' }}
        </button>
      </div>
    </div>

    <div class="mt-6 bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900">Create Role</h2>
      <p class="text-sm text-gray-500 mt-1">Add a new role to a team.</p>
      <div class="mt-4 flex flex-col sm:flex-row gap-3">
        <select
          v-model="newRoleTeamId"
          class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/20 focus:border-[#FF8C4B]"
          :disabled="teamsLoading || !allTeams.length"
        >
          <option value="" disabled>Select a team…</option>
          <option v-for="team in allTeams" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
        <input
          v-model="newRoleName"
          placeholder="Role name"
          class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/20 focus:border-[#FF8C4B]"
        />
        <input
          v-model="newRoleDesc"
          placeholder="Description (optional)"
          class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C4B]/20 focus:border-[#FF8C4B]"
        />
        <button
          type="button"
          :disabled="!newRoleName.trim() || !newRoleTeamId || creatingRole"
          class="px-4 py-2 text-sm font-medium text-white bg-[#FF8C4B] rounded-lg hover:bg-[#F27D3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
          @click="createRole"
        >
          {{ creatingRole ? 'Creating…' : 'Create' }}
        </button>
      </div>
    </div>

    <div class="mt-6 bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900">Teams</h2>
      <p class="text-sm text-gray-500 mt-1">Manage existing teams. Deleting a team cascades to its members and roles.</p>
      <div v-if="teamsLoading && !allTeams.length" class="mt-4 text-sm text-gray-400">Loading…</div>
      <ul v-else-if="allTeams.length" class="mt-4 divide-y divide-gray-100">
        <li v-for="team in allTeams" :key="team.id" class="flex items-center justify-between gap-3 py-2.5">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900">{{ team.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ team.description || 'No description' }} · {{ team._count.members }} members</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
            @click="deletingTeam = team"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        </li>
      </ul>
      <p v-else class="mt-4 text-sm text-gray-400">No teams yet.</p>
    </div>

    <div class="mt-6 bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900">Roles</h2>
      <p class="text-sm text-gray-500 mt-1">Manage existing roles. Deleting a role removes its assignments.</p>
      <div v-if="rolesLoading && !allRoles.length" class="mt-4 text-sm text-gray-400">Loading…</div>
      <ul v-else-if="allRoles.length" class="mt-4 divide-y divide-gray-100">
        <li v-for="role in allRoles" :key="role.id" class="flex items-center justify-between gap-3 py-2.5">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900">{{ role.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ teamName(role.teamId) }} · {{ role.description || 'No description' }}</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
            @click="deletingRole = role"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        </li>
      </ul>
      <p v-else class="mt-4 text-sm text-gray-400">No roles yet.</p>
    </div>

    <ConfirmDialog
      :open="!!deletingTeam"
      title="Delete team?"
      :message="deleteTeamMessage"
      confirm-label="Delete"
      cancel-label="Cancel"
      :disabled="teamDeleteLoading"
      @confirm="confirmDeleteTeam"
      @cancel="deletingTeam = null"
    />

    <ConfirmDialog
      :open="!!deletingRole"
      title="Delete role?"
      :message="deleteRoleMessage"
      confirm-label="Delete"
      cancel-label="Cancel"
      :disabled="roleDeleteLoading"
      @confirm="confirmDeleteRole"
      @cancel="deletingRole = null"
    />
  </div>
</template>
