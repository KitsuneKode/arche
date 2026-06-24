import { z } from 'zod'

export const findUserByEmailSchema = z.object({
  email: z.email(),
})

/** @deprecated Use findUserByEmailSchema — kept for generator compatibility during migration */
export const createUserSchema = findUserByEmailSchema.extend({
  name: z.string().min(5).optional(),
})
