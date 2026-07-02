import type { TelegramMessage } from "./client/interface";
import type { EnvelopeWithPayload } from "../contract";

export function normalizeTelegramMessage(
    msg: TelegramMessage,
): EnvelopeWithPayload {
    return {
        envelope: {
            source_plugin: "telegram",
            source_id: msg.id.toString(),
            type: "message",
            has_attachment: false,
            author_ref: msg.author,
            occurred_at: msg.date.toISOString(),
        },
        payload: {
            type: "direct",
            content: msg.text,
            group_id: msg.chatId,
            reply_to: msg.replyTo?.toString() ?? null,
            reactions: {},
            pinned: false,
            edited_date: null,
            entities: null,
            raw_payload: msg.raw,
        },
    };
}
