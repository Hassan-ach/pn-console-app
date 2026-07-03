import { TelegramClient as GramJsClient } from "telegram";
import { StringSession } from "telegram/sessions";
import type { TelegramMessage } from "./interface";
import { TelegramClient } from "./interface";

export class GramJsTelegramClient extends TelegramClient {
    private client: GramJsClient | null = null;
    private session: StringSession;

    constructor(
        private apiId: number,
        private apiHash: string,
    ) {
        super();
        this.session = new StringSession("");
    }

    async connect(
        phoneNumber: string,
        password?: string,
        onCode?: () => Promise<string>,
    ): Promise<void> {
        this.client = new GramJsClient(this.session, this.apiId, this.apiHash, {
            connectionRetries: 5,
        });
        await this.client.start({
            phoneNumber,
            password: async () => password ?? "",
            phoneCode: onCode ?? (async () => ""),
            onError: (err) => {
                throw err;
            },
        });
    }

    async *fetchMessages(
        chatId: string,
        start: Date,
        end: Date,
        limit: number,
    ): AsyncGenerator<TelegramMessage[]> {
        if (!this.client) throw new Error("Not connected");
        const chat = await this.client.getEntity(chatId);

        let offsetId = 0;
        let totalFetched = 0;
        const maxLimit = limit < 0 ? Infinity : limit;

        while (totalFetched < maxLimit) {
            const batchSize = Math.min(100, maxLimit - totalFetched);
            const messages: any[] = await this.client.getMessages(chat, {
                limit: batchSize,
                offsetId,
            });

            if (messages.length === 0) break;

            const chunk: TelegramMessage[] = [];
            for (const msg of messages) {
                const ts =
                    msg.date instanceof Date
                        ? msg.date
                        : new Date(msg.date * 1000);
                if (ts < start || ts > end) continue;

                const raw = JSON.parse(JSON.stringify(msg));
                chunk.push({
                    id: msg.id,
                    chatId: chatId,
                    text: msg.text ?? msg.message ?? "",
                    date: ts,
                    replyTo: msg.replyTo?.replyToMsgId ?? null,
                    author: msg.sender?.username ?? null,
                    hasAttachment: !!(msg.media),
                    reactions: raw.reactions ?? {},
                    pinned: !!msg.pinned,
                    editedDate: msg.editDate ?? null,
                    entities: msg.entities ?? null,
                    raw,
                });
            }

            if (chunk.length > 0) yield chunk;

            totalFetched += messages.length;
            offsetId = messages[messages.length - 1].id;
            if (messages.length < 100) break;
        }
    }

    subscribe(_: (msg: TelegramMessage) => void): () => void {
        throw new Error("Not implemented yet");
    }

    async disconnect(): Promise<void> {
        throw new Error("Not implemented yet");
    }
}
