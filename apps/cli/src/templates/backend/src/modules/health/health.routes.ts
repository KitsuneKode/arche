import { Router } from 'express'
import { asyncHandler } from '../../common/middleware/async-handler.js'
import { healthController } from './health.controller.js'

export const healthRoutes = Router()

healthRoutes.get(
  '/',
  asyncHandler(async (req, res) => healthController.getHealth(req, res)),
)
