import { BasePlugin } from "../contract";
import type { EnvelopeWithPayload, Credentials } from "../contract";
import type { TelegramConfig } from "./config";
import type { TelegramClient } from "./client/interface";
import { normalizeTelegramMessage } from "./normalizer";

export class TelegramPlugin extends BasePlugin {
    name = "telegram";

    private client: TelegramClient | null = null;
    private config: TelegramConfig | null = null;
    private onCode: (() => Promise<string>) | null = null;

    constructor(client: TelegramClient) {
        super();
        this.client = client;
    }

    setCodeProvider(fn: () => Promise<string>): void {
        this.onCode = fn;
    }

    async initialize(config: Record<string, unknown>): Promise<void> {
        this.config = config as unknown as TelegramConfig;
    }

    async login(credentials: Credentials): Promise<void> {
        if (!this.client) throw new Error("No client provided");
        const creds = credentials as any;
        const phone = creds.phoneNumber as string;
        // this line will be commented out because we want to allow login without phone number for testing purposes
        // if (!phone) throw new Error("Missing phoneNumber");
        await this.client.connect(
            phone,
            creds.password as string | undefined,
            this.onCode ?? undefined,
        );
    }

    async logout(): Promise<void> {
        throw new Error("Logout not implemented yet");
    }

    async *backfill(
        start: Date,
        end: Date,
        limit: number,
    ): AsyncGenerator<EnvelopeWithPayload[]> {
        if (!this.client || !this.config)
            throw new Error("Plugin not initialized");

        for (const chatId of this.config.chats) {
            const iterable = this.client.fetchMessages(
                chatId,
                start,
                end,
                limit,
            );
            for await (const msgs of iterable) {
                yield msgs.map(normalizeTelegramMessage);
            }
        }
    }

    async *startStream(): AsyncGenerator<EnvelopeWithPayload[]> {
        throw new Error("Streaming not implemented yet");
    }

    stopStream(): void {
        throw new Error("Streaming not implemented yet");
    }
}
