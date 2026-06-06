import { Router, type Router as ExpressRouter } from 'express'

export const healthRoutes: ExpressRouter = Router()

healthRoutes.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'polyglot-api',
    timestamp: new Date().toISOString(),
  })
})
