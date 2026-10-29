import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { multerUpload, uploadFile } from '../controllers/files.controller.js'

export const filesRouter: ReturnType<typeof Router> = Router()

filesRouter.post('/upload', authenticate, multerUpload, uploadFile)
