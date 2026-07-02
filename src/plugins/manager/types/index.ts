import type { EnvelopeData, ChatPayloadData } from '../../contract'

export interface EnvelopeInput extends EnvelopeData {
  id: string
  payload_ref: string
  organization_id: string | null
  ingested_at: string
  status: 'pending' | 'ready' | 'failed'
  permissions: Record<string, unknown>
}

export interface ChatPayloadInput extends ChatPayloadData {
  id: string
}
