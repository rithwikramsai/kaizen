import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as ctrl from '../controllers/publicIdeas.controller.js'

export const publicRouter: ReturnType<typeof Router> = Router()

const lookupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests. Try again in 1 hour.' },
})

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many submissions. Try again in 1 hour.' },
})

publicRouter.get('/master-data',      ctrl.publicMasterData)
publicRouter.get('/employee-lookup',  lookupLimiter, ctrl.employeeLookup)
publicRouter.post('/idea-submit',     submitLimiter, ctrl.publicIdeaSubmit)
