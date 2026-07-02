import z from 'zod'

const InsightTypeSchema = z.enum(['task', 'urgency', 'info', 'decision'])

export const UpdatedInsightSchema = z.object({
  id: z.number(),
  type: InsightTypeSchema,
  content: z.string(),
})

export const NewInsightSchema = z.object({
  type: InsightTypeSchema,
  content: z.string(),
})

export const InsightResultSchema = z.object({
  updatedInsights: z.array(UpdatedInsightSchema),
  newInsights: z.array(NewInsightSchema),
})
