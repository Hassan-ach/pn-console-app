export interface TelegramMessage {
    id: number;
    chatId: string;
    text: string;
    date: Date;
    replyTo: number | null;
    author: string | null;
    hasAttachment: boolean;
    reactions: Record<string, unknown>;
    pinned: boolean;
    editedDate: string | null;
    entities: Record<string, unknown> | null;
    raw: Record<string, unknown>;
}

export abstract class TelegramClient {
    abstract connect(
        phoneNumber: string,
        password?: string,
        onCode?: () => Promise<string>,
    ): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract fetchMessages(
        chatId: string,
        start: Date,
        end: Date,
        limit: number,
    ): AsyncIterable<TelegramMessage[]>;
    abstract subscribe(cb: (msg: TelegramMessage) => void): () => void;
}
