import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { router } from './routes/index.js'

export function createApp(): express.Application {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use('/api/v1', router)

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })

  return app
}
