import type { EnvelopeWithPayload } from './types'

export { type EnvelopeData, type ChatPayloadData, type EnvelopeWithPayload } from './types'

export abstract class Credentials {}

export abstract class BasePlugin<TCreds extends Credentials = Credentials> {
  abstract name: string

  protected abortController: AbortController | null = null

  abstract initialize(config: Record<string, unknown>): Promise<void>
  abstract login(credentials: TCreds): Promise<void>
  abstract logout(): Promise<void>
  abstract backfill(start: Date, end: Date, limit: number): AsyncIterable<EnvelopeWithPayload[]>
  abstract startStream(): void
  abstract stopStream(): void
}
