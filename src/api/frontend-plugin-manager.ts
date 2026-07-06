import { api } from './client';

export interface PluginInfo {
  name: string;
  state: string;
}

export interface PluginLoginResult {
  status: 'ok' | 'need_code' | 'need_password';
  pendingId?: string;
}

export interface BulkInsertResult {
  inserted: number;
}

export class PluginManagerClient {
  async list(): Promise<PluginInfo[]> {
    return api.get<PluginInfo[]>('/plugins');
  }

  async getState(name: string): Promise<PluginInfo> {
    return api.get<PluginInfo>(`/plugins/${name}`);
  }

  async initialize(name: string, config: Record<string, unknown>): Promise<void> {
    await api.post(`/plugins/${name}/initialize`, { config });
  }

  async login(
    name: string,
    credentials: Record<string, unknown>,
  ): Promise<PluginLoginResult> {
    return api.post<PluginLoginResult>(`/plugins/${name}/login`, { credentials });
  }

  async action(
    name: string,
    action: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    return api.post(`/plugins/${name}/action`, { action, params });
  }

  async submitCode(pendingId: string, code: string): Promise<PluginLoginResult> {
    return api.post<PluginLoginResult>(`/plugins/telegram/action`, {
      action: 'submit-code',
      params: { pendingId, code },
    });
  }

  async submitPassword(pendingId: string, password: string): Promise<void> {
    await api.post('/plugins/telegram/action', {
      action: 'submit-password',
      params: { pendingId, password },
    });
  }

  async backfill(
    plugin: string,
    limit: number,
  ): Promise<BulkInsertResult> {
    return api.post<BulkInsertResult>('/injection/backfill', {
      plugin,
      limit,
    });
  }

  async logout(name: string): Promise<void> {
    await api.post(`/plugins/${name}/logout`);
  }
}
