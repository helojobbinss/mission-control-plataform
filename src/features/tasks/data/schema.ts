import { z } from 'zod'

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  satellite_id: z.number().optional(),
  satellite_name: z.string().optional(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  Operador: z.string(),
  description: z.string().optional(),
  budget: z.string().optional(),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
  started_at: z.string().nullable().optional(),
  ended_at: z.string().nullable().optional(),
})

export type Task = z.infer<typeof taskSchema>
