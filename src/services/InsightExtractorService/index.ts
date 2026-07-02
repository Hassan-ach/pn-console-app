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

const chain = InsightExtractionPrompt.pipe(llmWithStructuredOutput)

export default async function extractInsights(
  history: InputInsight[],
  messages: InputMessage[]
): Promise<InsightExtractionResult> {
  return await chain.invoke({
    history: JSON.stringify(history),
    messages: JSON.stringify(messages),
  })
}
