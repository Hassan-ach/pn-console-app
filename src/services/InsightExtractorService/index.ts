import { InsightExtractionResult, InsightResultSchema } from './InsightSchema'
import InsightExtractionPrompt from './InsightExtractionPrompt'
import { InputInsight, InputMessage } from './types'
import createLLM from './LlmFactory'

async function getLlmWithStructuredOuptut() {
  const llm = await createLLM()
  return llm.withStructuredOutput(InsightResultSchema)
}
const llmWithStructuredOutput = await getLlmWithStructuredOuptut()

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
      `insights extraction failed after 3 attempts: ${(error as Error).message}`
    )
  }
  return result
}
