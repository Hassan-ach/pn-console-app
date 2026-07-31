import { reactive, computed, toRefs } from 'vue';
import { profileApi, type ProfileMetaData } from '../api/teams-api';

interface UserState {
  profile: ProfileMetaData | null;
  loading: boolean;
  error: string | null;
}

const state = reactive<UserState>({
  profile: null,
  loading: false,
  error: null,
});

let fetched = false;

export function useUser() {
  async function fetchProfile() {
    if (state.loading) return;
    state.loading = true;
    state.error = null;
    try {
      state.profile = await profileApi.getMetaData();
      fetched = true;
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Failed to load profile';
    } finally {
      state.loading = false;
    }
  }

  if (!fetched) {
    fetchProfile();
  }

  return {
    ...toRefs(state),
    isAdmin: computed(() => state.profile?.role === 'ADMIN'),
    teams: computed(() => state.profile?.teams ?? []),
    refresh: fetchProfile,
  };
}
