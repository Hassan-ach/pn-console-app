import { TelegramClient as GramJsClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
import type { TelegramMessage } from "./interface";
import { TelegramClient } from "./interface";

export class GramJsTelegramClient extends TelegramClient {
    private client: GramJsClient | null = null;
    private session: StringSession;
    private handlerCleanup: (() => void) | null = null;

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

    async disconnect(): Promise<void> {
        this.handlerCleanup?.();
        this.handlerCleanup = null;
        await this.client?.destroy();
        this.client = null;
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

                chunk.push({
                    id: msg.id,
                    chatId: chatId,
                    text: msg.text ?? msg.message ?? "",
                    date: ts,
                    replyTo: msg.replyTo?.replyToMsgId ?? null,
                    author: msg.sender?.username ?? null,
                    raw: JSON.parse(JSON.stringify(msg)),
                });
            }

            if (chunk.length > 0) yield chunk;

            totalFetched += messages.length;
            offsetId = messages[messages.length - 1].id;
            if (messages.length < 100) break;
        }
    }

    subscribe(cb: (msg: TelegramMessage) => void): () => void {
        if (!this.client) throw new Error("Not connected");

        const handler = (event: any) => {
            const msg = event.message;
            if (!msg || !msg.date) return;

            const ts =
                msg.date instanceof Date
                    ? msg.date
                    : new Date(msg.date * 1000);
            cb({
                id: msg.id,
                chatId: msg.chatId?.toString() ?? "",
                text: msg.text ?? msg.message ?? "",
                date: ts,
                replyTo: msg.replyTo?.replyToMsgId ?? null,
                author: msg.sender?.username ?? null,
                raw: JSON.parse(JSON.stringify(msg)),
            });
        };

        this.client.addEventHandler(handler, new NewMessage({}));
        const cleanup = () => {
            this.client?.removeEventHandler(handler, new NewMessage({}));
        };
        this.handlerCleanup = cleanup;
        return cleanup;
    }
}
