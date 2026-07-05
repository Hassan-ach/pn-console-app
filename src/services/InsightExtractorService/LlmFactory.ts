import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

export type LLMProvider = 'ollama' | 'openai' | 'anthropic' | 'google' | 'grok'

function readEnv(key: string): string | undefined {
  return import.meta.env[key]
}

function requireEnv(key: string): string {
  const value = readEnv(key)
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function readProvider(): LLMProvider {
  return requireEnv('VITE_LLM_PROVIDER') as LLMProvider
}

export default async function createLLM(): Promise<BaseChatModel> {
  const provider = readProvider()
  const model = requireEnv('VITE_LLM_MODEL')

  switch (provider) {
    case 'ollama': {
      const { ChatOllama } = await import('@langchain/ollama')
      // Ollama has no API key; LLM_API_KEY doubles as the base URL here.
      return new ChatOllama({
        model,
        baseUrl: requireEnv('VITE_LLM_API_KEY'),
        temperature: 0,
        streaming: false,
        think: false,
      }) as unknown as BaseChatModel
    }

    case 'openai': {
      const { ChatOpenAI } = await import('@langchain/openai')
      return new ChatOpenAI({
        model,
        apiKey: requireEnv('VITE_LLM_API_KEY'),
        temperature: 0,
        streaming: false,
      }) as unknown as BaseChatModel
    }

    case 'anthropic': {
      const { ChatAnthropic } = await import('@langchain/anthropic')
      return new ChatAnthropic({
        model,
        apiKey: requireEnv('VITE_LLM_API_KEY'),
        temperature: 0,
        streaming: false,
      }) as unknown as BaseChatModel
    }

    case 'google': {
      const { ChatGoogleGenerativeAI } = await import(
        '@langchain/google-genai'
      )
      return new ChatGoogleGenerativeAI({
        model,
        apiKey: requireEnv('VITE_LLM_API_KEY'),
        temperature: 0,
        streaming: false,
      }) as unknown as BaseChatModel
    }

    case 'grok': {
      const { ChatXAI } = await import('@langchain/xai')
      return new ChatXAI({
        model,
        apiKey: requireEnv('VITE_LLM_API_KEY'),
        temperature: 0,
        streaming: false,
      }) as unknown as BaseChatModel
    }

    default: {
      const _exhaustive: never = provider
      throw new Error(`Unsupported LLM provider: ${_exhaustive}`)
    }
  }
}
