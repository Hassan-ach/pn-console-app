import { invoke } from "@tauri-apps/api/core";
import type { TelegramMessage } from "./interface";
import { TelegramClient } from "./interface";

interface TgMessageRaw {
    id: number;
    chat_id: string;
    text: string;
    date: string;
    reply_to: number | null;
    author: string | null;
    has_attachment: boolean;
    reactions: Record<string, unknown>;
    pinned: boolean;
    edited_date: string | null;
    entities: Record<string, unknown> | null;
    raw: Record<string, unknown>;
}

function toTelegramMessage(msg: TgMessageRaw): TelegramMessage {
    return {
        id: msg.id,
        chatId: msg.chat_id,
        text: msg.text,
        date: new Date(msg.date),
        replyTo: msg.reply_to,
        author: msg.author,
        hasAttachment: msg.has_attachment,
        reactions: msg.reactions,
        pinned: msg.pinned,
        editedDate: msg.edited_date,
        entities: msg.entities,
        raw: msg.raw,
    };
}

export class GrammersTelegramClient extends TelegramClient {
    constructor(
        private apiId?: number,
        private apiHash?: string,
    ) {
        super();
    }

    async connect(
        phoneNumber: string,
        password?: string,
        onCode?: () => Promise<string>,
    ): Promise<void> {
        const r = await invoke<string>("tg_login", {
            config: this.apiId && this.apiHash ? {
                api_id: this.apiId,
                api_hash: this.apiHash,
                phone: phoneNumber,
                password: password ?? null,
            } : null,
        });
        if (r === "need_code") {
            if (!onCode) throw new Error("Code required but no onCode provided");
            const code = await onCode();
            await invoke("tg_submit_code", { code });
        }
    }

    async disconnect(): Promise<void> {
        throw new Error("not implemented");
    }

    async *fetchMessages(
        chatId: string,
        _start: Date,
        _end: Date,
        limit: number,
    ): AsyncIterable<TelegramMessage[]> {
        const msgs = await invoke<TgMessageRaw[]>("tg_backfill", {
            chatId: chatId,
            limit,
        });
        yield msgs.map(toTelegramMessage);
    }

    subscribe(_cb: (msg: TelegramMessage) => void): () => void {
        throw new Error("not implemented");
    }
}
