import { Router } from 'express'
import { getAdminQueueAdapter } from './admin.service'

export const adminRoutes = Router()

adminRoutes.use('/', (req, res, next) => {
  const adapter = getAdminQueueAdapter().getRouter()
  return adapter(req, res, next)
})
