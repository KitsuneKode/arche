import { isRedisEnabled } from '@arche-template/backend-common/redis-enabled'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import { env } from './common/env'
import { errorHandler } from './common/middleware/error-handler'
import { apiRateLimit } from './common/middleware/rate-limit'
import { securityHeaders } from './common/middleware/security-headers'
import { tracingMiddleware } from './common/middleware/tracing'
import { adminRoutes } from './modules/admin/admin.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { healthRoutes } from './modules/health/health.routes'
import { rootRoutes } from './modules/root/root.routes'
import { trpcRoutes } from './modules/trpc/trpc.routes'

const app = express()

app.use(tracingMiddleware)
app.use(securityHeaders)
app.use(compression())

app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }),
)

if (isRedisEnabled()) {
  app.use('/admin/queues', adminRoutes)
}
app.use('/api/auth', authRoutes)

app.use(express.json({ limit: '1mb' }))
app.use('/api/trpc', apiRateLimit, trpcRoutes)

app.use('/health', healthRoutes)
app.use('/', rootRoutes)

app.all('/{*splat}', (_req, res) => {
  res.status(404).json({ message: 'Not Found' })
})

app.use(errorHandler)

export default app
