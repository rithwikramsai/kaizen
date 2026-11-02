import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import * as ctrl from '../controllers/reporting.controller.js'

export const reportsRouter: ReturnType<typeof Router> = Router()

// GET /reports/dashboard
reportsRouter.get('/dashboard', authenticate, requirePermission('CAN_VIEW_REPORTS'), ctrl.dashboard)
