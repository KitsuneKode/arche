import { getDemoCapabilities } from '@arche-template/backend-common/demo-policy'
import type { TRPCRouterRecord } from '@trpc/server'

import { publicProcedure } from '../trpc/trpc.js'

export const demoRouter = {
  capabilities: publicProcedure.query(() => getDemoCapabilities()),
} satisfies TRPCRouterRecord
