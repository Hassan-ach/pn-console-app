import { api } from "./client";

export interface PluginInfo {
    name: string;
    state: string;
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

export class PluginManagerClient {
    async list(): Promise<PluginInfo[]> {
        return api.get<PluginInfo[]>("/plugins");
    }

    async getState(name: string): Promise<PluginInfo> {
        return api.get<PluginInfo>(`/plugins/${name}`);
    }

    async logout(name: string): Promise<void> {
        await api.post(`/plugins/${name}/logout`);
    }

    async createConfig(
        name: string,
        config: Record<string, unknown>,
    ): Promise<void> {
        await api.post(`/plugins/${name}/config`, { config });
    }

    async getConfig(name: string): Promise<Record<string, unknown>> {
        return api.get<Record<string, unknown>>(`/plugins/${name}/config`);
    }

    async updateConfig(
        name: string,
        config: Record<string, unknown>,
    ): Promise<void> {
        await api.patch(`/plugins/${name}/config`, { config });
    }

    async backfill(plugin: string, limit: number): Promise<BulkInsertResult> {
        return api.post<BulkInsertResult>("/ingestion/backfill", {
            plugin,
            limit,
        });
    }

    async getEnvelopeCount(sourcePlugin?: string): Promise<{ count: number }> {
        const params = sourcePlugin ? `?sourcePlugin=${sourcePlugin}` : "";
        return api.get<{ count: number }>(`/demo/envelopes/count${params}`);
    }
}
