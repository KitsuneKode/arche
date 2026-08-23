import type { TRPCRouterRecord } from '@trpc/server'

import { getDemoCapabilities } from '@arche-template/backend-common/demo-policy'
import { publicProcedure } from '../trpc/trpc'
import { demoStackSnapshotSchema } from './demo.dto'
import { demoService } from './demo.service'

export const demoRouter = {
  capabilities: publicProcedure.query(() => getDemoCapabilities()),

  stackSnapshot: publicProcedure
    .output(demoStackSnapshotSchema)
    .query(() => demoService.stackSnapshot()),
} satisfies TRPCRouterRecord
