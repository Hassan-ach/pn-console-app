import { api } from './client';

export interface ProfileMetaData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  teams: Array<{
    id: string;
    name: string;
    roles: string[];
  }>;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count: { members: number };
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  roles: Array<{
    id: string;
    roleId: string;
    role: { id: string; name: string; teamId: string };
  }>;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export interface CreateRolePayload {
  name: string;
  teamId: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  teamId?: string;
  description?: string;
}

export interface AddMemberPayload {
  userId: string;
  roleIds: string[];
}

export interface JoinMemberPayload {
  roleIds?: string[];
}

export interface UpdateMemberPayload {
  roleIds: string[];
}

export const profileApi = {
  getMetaData() {
    return api.get<ProfileMetaData>('/profile/meta-data');
  },
};

export const teamsApi = {
  list() {
    return api.get<Team[]>('/teams');
  },

  get(id: string) {
    return api.get<TeamDetail>(`/teams/${id}`);
  },

  create(payload: CreateTeamPayload) {
    return api.post<Team>('/teams', payload);
  },

  update(id: string, payload: UpdateTeamPayload) {
    return api.patch<Team>(`/teams/${id}`, payload);
  },

  remove(id: string) {
    return api.del<void>(`/teams/${id}`);
  },
};

export const rolesApi = {
  list() {
    return api.get<Role[]>('/roles');
  },

  get(id: string) {
    return api.get<Role>(`/roles/${id}`);
  },

  create(payload: CreateRolePayload) {
    return api.post<Role>('/roles', payload);
  },

  update(id: string, payload: UpdateRolePayload) {
    return api.patch<Role>(`/roles/${id}`, payload);
  },

  remove(id: string) {
    return api.del<void>(`/roles/${id}`);
  },
};

export const teamMembersApi = {
  add(teamId: string, payload: AddMemberPayload) {
    return api.post<TeamMember>(`/teams/${teamId}/members`, payload);
  },

  joinOwn(teamId: string, payload: JoinMemberPayload = {}) {
    return api.post<TeamMember>(`/teams/${teamId}/members/me`, payload);
  },

  update(teamId: string, userId: string, payload: UpdateMemberPayload) {
    return api.patch<TeamMember>(`/teams/${teamId}/members/${userId}`, payload);
  },

  remove(teamId: string, userId: string) {
    return api.del<void>(`/teams/${teamId}/members/${userId}`);
  },

  updateOwn(teamId: string, payload: UpdateMemberPayload) {
    return api.patch<TeamMember>(`/teams/${teamId}/members/me`, payload);
  },

  leave(teamId: string) {
    return api.del<void>(`/teams/${teamId}/members/me`);
  },
};
