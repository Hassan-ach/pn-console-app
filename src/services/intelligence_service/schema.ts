import z from 'zod'

const ItemTypeSchema = z.enum(['task', 'urgency', 'info', 'decision'])

// the schema for the items that were updated
export const UpdatedItemSchema = z.object({
  id: z.number(),
  type: ItemTypeSchema,
  content: z.string(),
})

// the schema for the new items
export const NewItemSchema = z.object({
  type: ItemTypeSchema,
  content: z.string(),
})

// the final result schema
export const ResultSchema = z.object({
  updates: z.array(UpdatedItemSchema),
  new: z.array(NewItemSchema),
})
