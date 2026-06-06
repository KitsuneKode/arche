import { toNodeHandler, auth } from '@arche-template/auth/server'
import { Router } from 'express'
import { authRateLimit } from '../../common/middleware/rate-limit'
import { timingMiddleware } from '../../common/middleware/timing'

export const authRoutes = Router()

authRoutes.all('/*splat', timingMiddleware, authRateLimit, toNodeHandler(auth))
