import { ChatOllama } from '@langchain/ollama'
import { InsightExtractionResult, InsightResultSchema } from './InsightSchema'
import InsightExtractionPrompt from './InsightExtractionPrompt'
import { InputInsight, InputMessage } from './types'

const llmWithStructuredOutput = new ChatOllama({
  model: import.meta.env.VITE_OLLAMA_MODEL,
  temperature: 0,
  think: false,
  streaming: false,
  baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL,
}).withStructuredOutput(InsightResultSchema)

export const chain = InsightExtractionPrompt.pipe(
  llmWithStructuredOutput
).withRetry({
  stopAfterAttempt: 3,
})

export default async function extractInsights(
  history: InputInsight[],
  messages: InputMessage[]
): Promise<InsightExtractionResult> {
  let result: InsightExtractionResult
  try {
    result = await chain.invoke({
      history: JSON.stringify(history),
      messages: JSON.stringify(messages),
    })
  } catch (error) {
    throw new Error(
      ' insights extraction failed after 3 attempts: ${(error as Error).message} '
    )
  }
  return result
}
