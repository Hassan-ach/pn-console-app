import z from 'zod'

const CommunicationInsightTypeSchema = z.enum([
  'task',
  'urgency',
  'info',
  'decision',
])

export const UpdatedCommunicationInsightSchema = z.object({
  id: z.number(),
  type: CommunicationInsightTypeSchema,
  content: z.string(),
})

export const NewCommunicationInsightSchema = z.object({
  type: CommunicationInsightTypeSchema,
  content: z.string(),
})

export const CommunicationInsightResultSchema = z.object({
  updatedCommunicationInsights: z.array(UpdatedCommunicationInsightSchema),
  newCommunicationInsights: z.array(NewCommunicationInsightSchema),
})
