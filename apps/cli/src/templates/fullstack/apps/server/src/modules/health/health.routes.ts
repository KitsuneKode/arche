import { Router } from 'express'
import { asyncHandler } from '../../common/middleware/async-handler'
import { noCache } from '../../common/middleware/cache'
import { healthController } from './health.controller'

export const healthRoutes = Router()

healthRoutes.get('/', noCache, asyncHandler(healthController.getHealth))
