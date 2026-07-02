import { BasePlugin } from '../contract'
import type { EnvelopeWithPayload, Credentials } from '../contract'
import type { TelegramConfig } from './config'
import type { TelegramClient } from './client/interface'
import { normalizeTelegramMessage } from './normalizer'

export class TelegramPlugin extends BasePlugin {
  name = 'telegram'

  private client: TelegramClient | null = null
  private config: TelegramConfig | null = null
  private streamBuffer: EnvelopeWithPayload[] = []
  private onCode: (() => Promise<string>) | null = null

  constructor(client: TelegramClient) {
    super()
    this.client = client
  }

  setCodeProvider(fn: () => Promise<string>): void {
    this.onCode = fn
  }

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.config = config as unknown as TelegramConfig
  }

  async login(credentials: Credentials): Promise<void> {
    if (!this.client) throw new Error('No client provided')
    const creds = credentials as any
    const phone = creds.phoneNumber as string
    if (!phone) throw new Error('Missing phoneNumber')
    await this.client.connect(phone, creds.password as string | undefined, this.onCode ?? undefined)
  }

  async logout(): Promise<void> {
    this.abortController?.abort()
    this.abortController = null
    await this.client?.disconnect()
    this.streamBuffer = []
  }

  async *backfill(
    start: Date,
    end: Date,
    limit: number,
  ): AsyncGenerator<EnvelopeWithPayload[]> {
    if (!this.client || !this.config) throw new Error('Plugin not initialized')

    for (const chatId of this.config.chats) {
      const iterable = this.client.fetchMessages(chatId, start, end, limit)
      for await (const msgs of iterable) {
        yield msgs.map(normalizeTelegramMessage)
      }
    }
  }

  async *startStream(): AsyncGenerator<EnvelopeWithPayload[]> {
    if (!this.client || !this.config) throw new Error('Plugin not initialized')

    this.abortController = new AbortController()
    let notify: () => void = () => {}

    const unsubscribe = this.client.subscribe((msg) => {
      this.streamBuffer.push(normalizeTelegramMessage(msg))
      notify()
    })

    this.abortController.signal.addEventListener('abort', () => {
      unsubscribe()
      notify()
    })

    try {
      while (!this.abortController.signal.aborted) {
        if (this.streamBuffer.length > 0) {
          yield this.streamBuffer.splice(0)
        } else {
          await new Promise<void>((r) => { notify = r })
        }
      }
    } finally {
      unsubscribe()
    }
  }

  stopStream(): void {
    this.abortController?.abort()
    this.abortController = null
  }
}
