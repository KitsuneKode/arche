import type { Request, Response } from 'express'
import { healthService } from './health.service'

export const healthController = {
  async getHealth(_req: Request, res: Response) {
    const result = await healthService.check()
    const statusCode = result.status === 'OK' ? 200 : 503
    res.status(statusCode).json(result)
  },
}
