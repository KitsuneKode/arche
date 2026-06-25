import { Router } from 'express'

import { liveStreamRateLimit } from '../../common/middleware/rate-limit.js'
import { latticeService } from '../lattice/lattice.service.js'
import { subscribeLiveEvents } from './live.events.js'

export const liveRoutes = Router()

liveRoutes.get('/stream', liveStreamRateLimit, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  send('ready', { ok: true })

  try {
    const snapshot = await latticeService.getPublicState()
    send('lattice:state', snapshot)
  } catch {
    // lattice may be unavailable during migration; stream still works for chat
  }

  const heartbeat = setInterval(() => {
    send('heartbeat', { ts: Date.now() })
  }, 30_000)

  const unsubscribe = subscribeLiveEvents((payload) => {
    if (payload.type === 'chat:message') {
      send('chat:message', { messageId: payload.messageId })
      return
    }
    if (payload.type === 'lattice:state') {
      send('lattice:state', payload.state)
    }
  })

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})
