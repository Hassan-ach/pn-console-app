export interface EnvelopeData {
    source_plugin: string;
    source_id: string;
    type: "chat";
    has_attachment: boolean;
    author_ref: string | null;
    occurred_at: string;
}

export interface ChatPayloadData {
    type: "message" | "email";
    content: string;
    group_id: string | null;
    reply_to: string | null;
    reactions: Record<string, unknown>;
    pinned: boolean;
    edited_date: string | null;
    entities: Record<string, unknown> | null;
    raw_payload: Record<string, unknown>;
}

export interface EnvelopeWithPayload<TPayload = ChatPayloadData> {
    envelope: EnvelopeData;
    payload: TPayload;
}
