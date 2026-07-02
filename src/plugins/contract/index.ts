import type { EnvelopeWithPayload, Payload } from "./types";

export {
    type EnvelopeData,
    type ChatPayloadData,
    type Payload,
    type EnvelopeWithPayload,
} from "./types";

export class Credentials {}

export abstract class BasePlugin<TPayload extends Payload = Payload> {
    abstract name: string;

    protected abortController: AbortController | null = null;

    abstract initialize(config: Record<string, unknown>): Promise<void>;
    abstract login(credentials: Credentials): Promise<void>;
    abstract logout(): Promise<void>;
    /** Pull historical data. Negative limit = fetch all. */
    abstract backfill(
        start: Date,
        end: Date,
        limit: number,
    ): AsyncIterable<EnvelopeWithPayload<TPayload>[]>;
    abstract startStream(): void;
    abstract stopStream(): void;
}
