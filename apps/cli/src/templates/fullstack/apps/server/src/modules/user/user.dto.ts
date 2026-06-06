import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(5),
})
