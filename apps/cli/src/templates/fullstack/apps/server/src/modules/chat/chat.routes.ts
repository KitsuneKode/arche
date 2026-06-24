import { Router } from 'express'
import { chatStreamRateLimit } from '../../common/middleware/rate-limit.js'
import { subscribeChatEvents } from './chat.events.js'

export const chatRoutes = Router()

chatRoutes.get('/stream', chatStreamRateLimit, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  send('ready', { ok: true })

  const heartbeat = setInterval(() => {
    send('heartbeat', { ts: Date.now() })
  }, 30_000)

  const unsubscribe = subscribeChatEvents((payload) => {
    send('message', payload)
  })

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})
