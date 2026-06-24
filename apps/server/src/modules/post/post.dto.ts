import { z } from 'zod'

export const postIdSchema = z.object({ id: z.string() })
export const postSlugSchema = z.object({ slug: z.string() })

export const createPostSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(2000),
  slug: z.string().min(1).max(80),
  published: z.boolean().optional(),
})

export const updatePostSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
})
