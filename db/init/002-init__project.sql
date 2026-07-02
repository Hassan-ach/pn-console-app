\c np_console_raw_db


CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE envelope_type AS ENUM (
    'message'
);

CREATE TYPE ingestion_status AS ENUM (
    'pending',
    'ready',
    'failed'
);

CREATE TYPE message_payload_type AS ENUM (
    'direct',
    'email'
);

CREATE TABLE IF NOT EXISTS message_payload (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type message_payload_type NOT NULL,

    content TEXT NOT NULL,

    group_id TEXT,

    reply_to TEXT,

    reactions JSONB NOT NULL DEFAULT '{}'::jsonb,

    pinned BOOLEAN NOT NULL DEFAULT FALSE,

    edited_date TIMESTAMPTZ,

    entities JSONB,

    raw_payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS envelope (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    source_plugin TEXT NOT NULL,

    source_id TEXT NOT NULL,

    type envelope_type NOT NULL,

    payload_ref UUID NOT NULL,

    has_attachment BOOLEAN NOT NULL DEFAULT FALSE,

    author_ref TEXT,

    organization_id TEXT,

    occurred_at TIMESTAMPTZ NOT NULL,

    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    status ingestion_status NOT NULL DEFAULT 'pending',

    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT uq_envelope_source
        UNIQUE (source_plugin, source_id),

    CONSTRAINT fk_envelope_payload
        FOREIGN KEY (payload_ref)
        REFERENCES message_payload(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);
