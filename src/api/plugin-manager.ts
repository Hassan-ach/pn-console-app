import { api } from "./client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PluginInfo {
    name: string;
    connected?: boolean;
    hasConfig?: boolean;
}

export interface BulkInsertResult {
    inserted: number;
}

export interface Insight {
    id: string | null;
    organizationId?: string;
    envolopsRef?: string[];
    broadcasted?: boolean;
    type: "TASK" | "URGENCY" | "INFO" | "DECISION";
    content: string;
    owners: string[];
    version?: number;
    createdAt?: string;
}

function ensureSuccess<T>(res: ApiResponse<T>): void {
  if (!res.success) throw new Error(res.message);
}

let listCache: { data: PluginInfo[]; ts: number } | null = null;
const LIST_TTL = 10_000;

export class PluginManagerClient {
    async list(): Promise<PluginInfo[]> {
        if (listCache && Date.now() - listCache.ts < LIST_TTL) return listCache.data;
        const res = await api.get<ApiResponse<PluginInfo[]>>("/plugins");
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

    async backfill(plugin: string, limit: number): Promise<BulkInsertResult> {
        const res = await api.post<ApiResponse<BulkInsertResult>>(
            "/ingestion/backfill",
            { plugin, limit },
        );
        if (!res.success) {
            const errors = (res.data as any)?.errors;
            const detail = errors?.length ? errors[0].message : res.message;
            throw new Error(detail);
        }
        return res.data!;
    }

    async getEnvelopeCount(sourcePlugin?: string): Promise<{ count: number }> {
        const params = sourcePlugin ? `?sourcePlugin=${sourcePlugin}` : "";
        return api.get<{ count: number }>(`/demo/envelopes/count${params}`);
    }
}
