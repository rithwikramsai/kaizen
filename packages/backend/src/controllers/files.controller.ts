import type { Request, Response, NextFunction, RequestHandler } from 'express'
import multer from 'multer'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import * as filesService from '../services/files.service.js'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const multerUpload: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
}).single('file')

export async function uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'No file provided')
      return
    }
    const entityType = (req.body as { entity_type?: string }).entity_type ?? 'idea'
    const result = await filesService.uploadFile(req.file, entityType, req.user!.id)
    sendSuccess(res, result, 201)
  } catch (err) {
    next(err)
  }
}
