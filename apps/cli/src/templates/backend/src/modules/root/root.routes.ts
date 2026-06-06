import { Router } from 'express'
import { asyncHandler } from '../../common/middleware/async-handler.js'
import { rootController } from './root.controller.js'

export const rootRoutes = Router()

rootRoutes.get('/', asyncHandler(rootController.getRoot))
