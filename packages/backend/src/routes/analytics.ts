import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import * as ctrl from '../controllers/analytics.controller.js'

export const analyticsRouter: ReturnType<typeof Router> = Router()

const guard = [authenticate, requirePermission('CAN_VIEW_REPORTS')] as const

analyticsRouter.get('/trends',           ...guard, ctrl.trends)
analyticsRouter.get('/weekly',           ...guard, ctrl.weekly)
analyticsRouter.get('/plants',           ...guard, ctrl.plants)
analyticsRouter.get('/zones',            ...guard, ctrl.zones)
analyticsRouter.get('/departments',      ...guard, ctrl.departments)
analyticsRouter.get('/categories',       ...guard, ctrl.categories)
analyticsRouter.get('/sla',              ...guard, ctrl.slaReport)
analyticsRouter.get('/export/csv',       ...guard, ctrl.exportCsvHandler)
analyticsRouter.get('/export/xlsx',      ...guard, ctrl.exportXlsxHandler)
