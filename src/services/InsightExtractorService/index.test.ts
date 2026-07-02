import { describe, it, expect, vi } from 'vitest'
import { InsightResultSchema } from './InsightSchema'
import { InputInsight, InputMessage } from './types'
import extractInsights, { chain } from '.'

const sampleHistory: InputInsight[] = [
  {
    id: 1,
    type: 'task',
    content: 'Send the Q3 budget report to the finance team',
  },
  {
    id: 2,
    type: 'urgency',
    content: 'Production server CPU usage spiking above 90%',
  },
]

const sampleMessages: InputMessage[] = [
  { id: 1, content: 'Q3 budget report has been sent to finance, all done.' },
]

describe('InsightExtractionService', () => {
  it('should connect to Ollama', async () => {
    const response = await extractInsights([], [])

    expect(response).toBeTruthy()
  })

  it('should return a valid schema', async () => {
    const result = await extractInsights(sampleHistory, sampleMessages)

    const parsed = InsightResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('should throw because LLM service is unteachable', async () => {
    vi.spyOn(chain, 'invoke').mockRejectedValue(new Error())

    await expect(extractInsights([], [])).rejects.toThrow()
  })
  it('should throw because of unstructred output', async () => {
    vi.spyOn(chain, 'invoke').mockRejectedValue({ newInsights: {} })

    await expect(extractInsights([], [])).rejects.toThrow()
  })
})
