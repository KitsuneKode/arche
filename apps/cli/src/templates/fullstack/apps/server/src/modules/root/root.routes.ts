import { Router } from 'express'
import { asyncHandler } from '../../common/middleware/async-handler'
import { noCache } from '../../common/middleware/cache'
import { rootController } from './root.controller'

export const rootRoutes = Router()

rootRoutes.get('/', noCache, asyncHandler(rootController.getRoot))
