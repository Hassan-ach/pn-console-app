import { api } from './client';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PluginInfo {
    name: string;
    connected?: boolean;
    hasConfig?: boolean;
    hasSession?: boolean;
}

function ensureSuccess<T>(res: ApiResponse<T>): void {
    if (!res.success) throw new Error(res.message);
}

let listCache: { data: PluginInfo[]; ts: number } | null = null;
const LIST_TTL = 10_000;

function clearListCache() {
  listCache = null;
}

export class PluginManagerClient {
    async list(): Promise<PluginInfo[]> {
        if (listCache && Date.now() - listCache.ts < LIST_TTL)
            return listCache.data;
        const res = await api.get<ApiResponse<PluginInfo[]>>('/plugins');
        ensureSuccess(res);
        listCache = { data: res.data ?? [], ts: Date.now() };
        return listCache.data;
    }

    async getState(name: string): Promise<PluginInfo> {
        const res = await api.get<ApiResponse<PluginInfo>>(`/plugins/${name}`);
        ensureSuccess(res);
        return res.data!;
    }

    async logout(name: string): Promise<string> {
        const res = await api.post<ApiResponse<never>>(
            `/plugins/${name}/logout`,
        );
        ensureSuccess(res);
        clearListCache();
        return res.message;
    }

    async login(
        name: string,
        config: Record<string, unknown>,
    ): Promise<{ platformUserId: string; platformUsername: string }> {
        const res = await api.post<
            ApiResponse<{ platformUserId: string; platformUsername: string }>
        >(`/plugins/${name}/login`, { config });
        ensureSuccess(res);
        clearListCache();
        return res.data!;
    }

    async createConfig(
        name: string,
        config: Record<string, unknown>,
    ): Promise<string> {
        const res = await api.post<ApiResponse<never>>(
            `/plugins/${name}/config`,
            { config },
        );
        ensureSuccess(res);
        clearListCache();
        return res.message;
    }

    async getConfig(name: string): Promise<Record<string, unknown>> {
        const res = await api.get<ApiResponse<Record<string, unknown>>>(
            `/plugins/${name}/config`,
        );
        ensureSuccess(res);
        return res.data ?? {};
    }

    async updateConfig(
        name: string,
        config: Record<string, unknown>,
    ): Promise<string> {
        const res = await api.patch<ApiResponse<never>>(
            `/plugins/${name}/config`,
            { config },
        );
        ensureSuccess(res);
        clearListCache();
        return res.message;
    }

    async getEnvelopeCount(sourcePlugin?: string): Promise<{ count: number }> {
        const params = sourcePlugin ? `?sourcePlugin=${sourcePlugin}` : '';
        return api.get<{ count: number }>(`/demo/envelopes/count${params}`);
    }

    async activate(name: string): Promise<ActivateResult> {
        const res = await api.post<ApiResponse<ActivateResult>>(
            `/plugins/${name}/activate`,
        );
        ensureSuccess(res);
        clearListCache();
        return res.data!;
    }

    async deactivate(name: string): Promise<void> {
        const res = await api.post<ApiResponse<never>>(
            `/plugins/${name}/deactivate`,
        );
        ensureSuccess(res);
        clearListCache();
    }

    async getActivationStatus(name: string): Promise<PluginActivationStatus> {
        const res = await api.get<ApiResponse<PluginActivationStatus>>(
            `/plugins/${name}/status`,
        );
        ensureSuccess(res);
        return res.data!;
    }

    async updateChats(
        name: string,
        chats: { name: string; id: string }[],
    ): Promise<void> {
        const res = await api.patch<ApiResponse<never>>(
            `/plugins/${name}/chats`,
            { chats },
        );
        ensureSuccess(res);
    }

    async getConfigSchema(name: string): Promise<ConfigFieldSchema[]> {
        const res = await api.get<ApiResponse<ConfigFieldSchema[]>>(
            `/plugins/${name}/config-schema`,
        );
        ensureSuccess(res);
        return res.data ?? [];
    }

    async getActivationRequirements(
        name: string,
    ): Promise<ActivationRequirementResult[]> {
        const res = await api.get<ApiResponse<ActivationRequirementResult[]>>(
            `/plugins/${name}/activation-requirements`,
        );
        ensureSuccess(res);
        return res.data ?? [];
    }
}

export type PluginStatus =
    | 'NOT_CONNECTED'
    | 'CONNECTED'
    | 'CONFIGURED'
    | 'ACTIVATING'
    | 'ACTIVE'
    | 'DEACTIVATING'
    | 'ERROR';

export interface ActivateResult {
    status: string;
    activatedChats: string[];
    alreadyActiveChats: string[];
}

export interface WorkerState {
    backfill: 'IDLE' | 'RUNNING' | 'COMPLETED';
    stream: 'IDLE' | 'LISTENING' | 'STOPPED';
    startedAt: string;
    backfillProgress?: { inserted: number; ids: string[] };
    flushes: number;
}

export interface PluginActivationStatus {
    status: string;
    activatedAt?: string;
    errorMessage?: string;
    platformUsername?: string;
    platformUserId?: string;
    chats: {
        chatId: string;
        name?: string;
        worker: WorkerState | null;
        cursor: number | null;
    }[];
}

export interface PluginConfig {
    name: string;
    status: PluginStatus;
    chats: { name: string; id: string }[];
    hasSession: boolean;
    errorMessage?: string;
}

export interface ConfigFieldSchema {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'checkbox-list' | 'boolean';
    required?: boolean;
    options?: { label: string; value: string }[];
    placeholder?: string;
    description?: string;
}

export interface ActivationRequirementResult {
    field: string;
    message: string;
    met: boolean;
}
