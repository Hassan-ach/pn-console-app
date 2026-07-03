import { invoke } from "@tauri-apps/api/core";
import { getDatabase } from "../database/DataBaseClient";
import type { EnvelopeWithPayload } from "../../plugins/contract";
import type { PluginManager } from "../../plugins/manager";

export interface BulkInsertResult {
    inserted: number;
    conflicts: number;
}

export async function ingestFromPlugin(
    manager: PluginManager,
    pluginName: string,
    start: Date,
    end: Date,
    limit: number,
): Promise<BulkInsertResult> {
    let total: BulkInsertResult = { inserted: 0, conflicts: 0 };

    for await (const chunk of manager.ingestBackfill(
        pluginName,
        start,
        end,
        limit,
    )) {
        const result = await insertEnvelopesCmd(chunk);
        total.inserted += result.inserted;
        total.conflicts += result.conflicts;
    }

    return total;
}

export async function insertEnvelopesCmd(
    items: EnvelopeWithPayload[],
): Promise<BulkInsertResult> {
    const inserted = await invoke<number>("tg_insert_envelopes", { items });
    const conflicts = items.length - inserted;
    return { inserted, conflicts };
}

export async function insertEnvelopes(
    items: EnvelopeWithPayload[],
): Promise<BulkInsertResult> {
    const db = await getDatabase();
    let inserted = 0;
    let conflicts = 0;

    await db.execute("BEGIN");

    try {
        for (const item of items) {
            const existing = await db.select<Record<string, unknown>[]>(
                "SELECT 1 FROM envelope WHERE source_plugin = $1 AND source_id = $2",
                [item.envelope.source_plugin, item.envelope.source_id],
            );

            if (existing.length > 0) {
                conflicts++;
                continue;
            }

            const payloadRows = await db.select<{ id: string }[]>(
                `INSERT INTO message_payload (type, content, group_id, reply_to, reactions, pinned, edited_date, entities, raw_payload)
         VALUES ($1::message_payload_type, $2, $3, $4, (SELECT $5::text)::jsonb, $6::boolean, NULLIF(TRIM(BOTH '"' FROM $7::text), '')::timestamptz, (SELECT $8::text)::jsonb, (SELECT $9::text)::jsonb)
         RETURNING id`,
                [
                    item.payload.type,
                    item.payload.content,
                    item.payload.group_id,
                    item.payload.reply_to,
                    JSON.stringify(item.payload.reactions),
                    item.payload.pinned,
                    item.payload.edited_date,
                    item.payload.entities
                        ? JSON.stringify(item.payload.entities)
                        : null,
                    JSON.stringify(item.payload.raw_payload),
                ],
            );

            await db.execute(
                `INSERT INTO envelope (source_plugin, source_id, type, payload_ref, has_attachment, author_ref, occurred_at, ingested_at, status, organization_id, permissions)
         VALUES ($1, $2, $3::envelope_type, $4::uuid, $5::boolean, $6, NULLIF(TRIM(BOTH '"' FROM $7::text), '')::timestamptz, NOW(), 'pending', NULL, '{}')`,
                [
                    item.envelope.source_plugin,
                    item.envelope.source_id,
                    item.envelope.type,
                    payloadRows[0].id,
                    item.envelope.has_attachment,
                    item.envelope.author_ref,
                    item.envelope.occurred_at,
                ],
            );

            inserted++;
        }

        await db.execute("COMMIT");
    } catch (error) {
        await db.execute("ROLLBACK");
        throw error;
    }

    return { inserted, conflicts };
}
