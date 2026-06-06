import type { NextFunction, Request, Response } from 'express'

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '0')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Download-Options', 'noopen')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.removeHeader('X-Powered-By')
  next()
}
