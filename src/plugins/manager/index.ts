import type {
    BasePlugin,
    Credentials,
    EnvelopeWithPayload,
    Payload,
} from "../contract";

export { type EnvelopeInput, type MessagePayloadInput } from "./types";

export enum PluginState {
    CREATED,
    INITIALIZED,
    LOGGED_IN,
    STREAMING,
    ERROR,
}

interface PluginRecord {
    instance: BasePlugin<Payload>;
    state: PluginState;
}

export class PluginManager {
    private plugins = new Map<string, PluginRecord>();

    register(plugin: BasePlugin<Payload>): void {
        this.plugins.set(plugin.name, {
            instance: plugin,
            state: PluginState.CREATED,
        });
    }

    get(name: string): BasePlugin<Payload> | undefined {
        return this.plugins.get(name)?.instance;
    }

    getState(name: string): PluginState | undefined {
        return this.plugins.get(name)?.state;
    }

    list(): Array<{ name: string; state: PluginState }> {
        return Array.from(this.plugins.entries()).map(([name, record]) => ({
            name,
            state: record.state,
        }));
    }

    async initPlugin(
        name: string,
        config: Record<string, unknown>,
    ): Promise<void> {
        const record = this.plugins.get(name);
        if (!record) throw new Error(`Plugin "${name}" not registered`);
        if (record.state !== PluginState.CREATED) {
            throw new Error(`Plugin "${name}" already initialized`);
        }
        try {
            await record.instance.initialize(config);
            record.state = PluginState.INITIALIZED;
        } catch (error) {
            record.state = PluginState.ERROR;
            throw error;
        }
    }

    async loginPlugin(name: string, credentials: Credentials): Promise<void> {
        const record = this.plugins.get(name);
        if (!record) throw new Error(`Plugin "${name}" not registered`);
        if (record.state !== PluginState.INITIALIZED) {
            throw new Error(`Plugin "${name}" must be initialized first`);
        }
        try {
            await record.instance.login(credentials);
            record.state = PluginState.LOGGED_IN;
        } catch (error) {
            record.state = PluginState.ERROR;
            throw error;
        }
    }

    async logoutPlugin(name: string): Promise<void> {
        const record = this.plugins.get(name);
        if (!record) throw new Error(`Plugin "${name}" not registered`);
        if (record.state === PluginState.CREATED) {
            throw new Error(`Plugin "${name}" not logged in`);
        }
        try {
            await record.instance.logout();
            record.state = PluginState.INITIALIZED;
        } catch (error) {
            record.state = PluginState.ERROR;
            throw error;
        }
    }

    startPlugin(name: string): AsyncIterable<EnvelopeWithPayload<Payload>[]> {
        const record = this.plugins.get(name);
        if (!record) throw new Error(`Plugin "${name}" not registered`);
        if (record.state !== PluginState.LOGGED_IN) {
            throw new Error(`Plugin "${name}" must be logged in first`);
        }
        try {
            const stream = record.instance.startStream();
            record.state = PluginState.STREAMING;
            return stream;
        } catch (error) {
            record.state = PluginState.ERROR;
            throw error;
        }
    }

    stopPlugin(name: string): void {
        const record = this.plugins.get(name);
        if (!record) throw new Error(`Plugin "${name}" not registered`);
        if (record.state !== PluginState.STREAMING) {
            throw new Error(`Plugin "${name}" is not streaming`);
        }
        try {
            record.instance.stopStream();
            record.state = PluginState.LOGGED_IN;
        } catch (error) {
            record.state = PluginState.ERROR;
            throw error;
        }
    }

    async startAll(): Promise<void> {
        for (const [, record] of this.plugins) {
            if (record.state !== PluginState.LOGGED_IN) continue;
            try {
                record.instance.startStream();
                record.state = PluginState.STREAMING;
            } catch {
                record.state = PluginState.ERROR;
            }
        }
    }

    stopAll(): void {
        for (const [, record] of this.plugins) {
            if (record.state !== PluginState.STREAMING) continue;
            try {
                record.instance.stopStream();
                record.state = PluginState.LOGGED_IN;
            } catch {
                record.state = PluginState.ERROR;
            }
        }
    }

    async unregister(name: string): Promise<void> {
        const record = this.plugins.get(name);
        if (!record) return;
        try {
            record.instance.stopStream();
            await record.instance.logout();
        } catch (error) {
            console.warn(
                `[PluginManager] Cleanup failed during unregister of "${name}":`,
                error,
            );
        }
        this.plugins.delete(name);
    }

    async *ingestBackfill(
        name: string,
        start: Date,
        end: Date,
        limit: number,
    ): AsyncGenerator<EnvelopeWithPayload[]> {
        const record = this.plugins.get(name);
        if (!record) throw new Error(`Plugin "${name}" not registered`);

        const iterable = record.instance.backfill(start, end, limit);
        for await (const chunk of iterable) {
            yield chunk;
        }
    }
}
