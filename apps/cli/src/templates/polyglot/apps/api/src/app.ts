import cors from 'cors'
import express, { type Express } from 'express'
import { healthRoutes } from './modules/health/health.routes.js'

const app: Express = express()

app.use(express.json())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
)

app.use('/health', healthRoutes)

export { app }
