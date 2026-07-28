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

export interface BulkInsertResult {
    inserted: number;
}

function ensureSuccess<T>(res: ApiResponse<T>): void {
    if (!res.success) throw new Error(res.message);
}

let listCache: { data: PluginInfo[]; ts: number } | null = null;
const LIST_TTL = 10_000;

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
        return res.message;
    }

    async backfill(
        items: { plugin: string; limit: number }[],
    ): Promise<BulkInsertResult> {
        const res = await api.post<ApiResponse<BulkInsertResult>>(
            '/ingestion/backfill',
            items,
        );
        if (!res.success) {
            const data = res.data as
                { errors?: { message: string }[] } | undefined;
            const detail = data?.errors?.length
                ? data.errors[0].message
                : res.message;
            throw new Error(detail);
        }
        return res.data!;
    }

    async getEnvelopeCount(sourcePlugin?: string): Promise<{ count: number }> {
        const params = sourcePlugin ? `?sourcePlugin=${sourcePlugin}` : '';
        return api.get<{ count: number }>(`/demo/envelopes/count${params}`);
    }

    async activate(name: string): Promise<ActivateResult> {
        const res = await api.post<ApiResponse<ActivateResult>>(`/plugins/${name}/activate`);
        ensureSuccess(res);
        return res.data!;
    }

    async deactivate(name: string): Promise<void> {
        const res = await api.post<ApiResponse<never>>(`/plugins/${name}/deactivate`);
        ensureSuccess(res);
    }

    async getActivationStatus(name: string): Promise<PluginActivationStatus> {
        const res = await api.get<ApiResponse<PluginActivationStatus>>(`/plugins/${name}/status`);
        ensureSuccess(res);
        return res.data!;
    }

    async updateChats(
        name: string,
        chats: { name: string; id: string }[],
    ): Promise<void> {
        const res = await api.patch<ApiResponse<never>>(`/plugins/${name}/chats`, { chats });
        ensureSuccess(res);
    }
}

export interface ActivateResult {
    status: string;
    activatedChats: string[];
    alreadyActiveChats: string[];
}

export interface PluginActivationStatus {
    status: string;
    activatedAt?: string;
    errorMessage?: string;
    chats: ChatWorkerState[];
}

export interface ChatWorkerState {
    chatId: string;
    backfill: { status: string; progress?: number };
    stream: { status: string; uptime?: number; batchesFlushed?: number };
    lastCursor?: number;
}

export interface PluginConfig {
    name: string;
    status: 'NOT_CONNECTED' | 'CONNECTED' | 'CONFIGURED' | 'ACTIVATING' | 'ACTIVE' | 'DEACTIVATING' | 'ERROR';
    chats: { name: string; id: string }[];
    hasSession: boolean;
    errorMessage?: string;
}

export interface ActivationMetrics {
    chatCount: number;
    backfillProgress?: { total: number; done: number } | null;
    streamUptime?: number;
    batchCount: number;
    messageCount: number;
}
