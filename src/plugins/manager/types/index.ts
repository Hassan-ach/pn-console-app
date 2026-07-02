import type { EnvelopeData, MessagePayloadData } from "../../contract";

export interface EnvelopeInput extends EnvelopeData {
    id: string;
    payload_ref: string;
    organization_id: string | null;
    ingested_at: string;
    status: "PENDING" | "READY" | "FAILED";
    permissions: Record<string, unknown>;
}

export interface MessagePayloadInput extends MessagePayloadData {
    id: string;
}
