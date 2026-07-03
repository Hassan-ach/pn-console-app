import { describe, it, expect, vi } from 'vitest'
import { InsightResultSchema } from './InsightSchema'
import { InputInsight, InputMessage } from './types'
import extractInsights, { chain } from '.'

const sampleHistory: InputInsight[] = [
  {
    id: 1,
    type: 'TASK',
    content: 'Send the Q3 budget report to the finance team',
  },
  {
    id: 2,
    type: 'URGENCY',
    content: 'Production server CPU usage spiking above 90%',
  },
]

const sampleMessages: InputMessage[] = [
  { id: 1, content: 'Q3 budget report has been sent to finance, all done.' },
]

const demoHistory: InputInsight[] = [
  { id: 1, type: 'TASK', content: 'Send the Q3 budget report to the finance team' },
  { id: 2, type: 'URGENCY', content: 'Production server CPU usage spiking above 90%, needs immediate investigation' },
  { id: 3, type: 'INFO', content: 'Client prefers communication via email, not phone' },
  { id: 4, type: 'DECISION', content: 'Approve or reject the proposal to migrate the database to PostgreSQL next quarter' },
  { id: 5, type: 'TASK', content: 'Schedule a 1:1 meeting with the new hire Sarah' },
]

const demoMessages: InputMessage[] = [
  { id: 1, content: 'Hey, just letting you know I sent the Q3 budget report to finance this morning, all done.' },
  { id: 2, content: 'CPU spike was caused by a runaway cron job. We killed it, usage is back to normal. No further action needed.' },
  { id: 3, content: 'Actually feel free to call me directly for urgent matters, email is fine for everything else.' },
  { id: 4, content: 'We need to order two new laptops for the design team before the next sprint kicks off.' },
]

describe('InsightExtractionService', () => {
it('demo test', async () => {
  const result = await extractInsights(demoHistory, demoMessages)

  console.log(JSON.stringify(result, null, 2))

  expect(InsightResultSchema.safeParse(result).success).toBe(true)
})
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
