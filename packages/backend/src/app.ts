import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { router } from './routes/index.js'
import { ServiceError } from './utils/errors.js'
import { sendError, ErrorCodes } from './utils/response.js'

export function createApp(): express.Application {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use('/api/v1', router)

  app.use((_req: Request, res: Response) => {
    sendError(res, 404, ErrorCodes.NOT_FOUND, 'Route not found')
  })

  // Global error handler — must have 4 parameters for Express to treat it as error middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ServiceError) {
      sendError(res, err.httpStatus, err.code, err.message)
      return
    }
    if (err instanceof Error) {
      // Multer file-type rejection
      if (err.message.startsWith('Unsupported file type')) {
        sendError(res, 400, ErrorCodes.VALIDATION_ERROR, err.message)
        return
      }
      // Multer file-size rejection
      if ('code' in err && (err as NodeJS.ErrnoException).code === 'LIMIT_FILE_SIZE') {
        sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'File too large. Maximum allowed size is 10 MB.')
        return
      }
    }
    console.error('[UnhandledError]', err)
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
  })

  return app
}
