import { z } from 'zod'

export const demoCapabilitiesSchema = z.object({
  autoSignIn: z.boolean(),
  chatSync: z.enum(['sse', 'poll']),
  liveSync: z.enum(['sse', 'poll']),
})

export const demoStackSnapshotSchema = z.object({
  fetchedAt: z.string(),
  health: z.object({
    status: z.string(),
    database: z.string(),
    schema: z.string(),
  }),
  capabilities: demoCapabilitiesSchema,
  redis: z.enum(['enabled', 'disabled']),
  feeds: z.object({
    chatMessageCount: z.number().int(),
    chatLatestAt: z.string().nullable(),
    publishedPostCount: z.number().int(),
    leaderboardEntryCount: z.number().int(),
  }),
})

export type DemoStackSnapshot = z.infer<typeof demoStackSnapshotSchema>
