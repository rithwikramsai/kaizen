import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import {
  adminDashboardHandler,
  listWorkflowTemplatesHandler,
  getWorkflowTemplateByIdHandler,
  createWorkflowTemplateHandler,
  listSlaConfigsHandler,
  updateSlaConfigHandler,
  createSlaConfigHandler,
  getAuditLogsHandler,
  systemHealthHandler,
} from '../controllers/admin.controller.js'

export const adminRouter: ReturnType<typeof Router> = Router()

adminRouter.use(authenticate)

adminRouter.get('/dashboard',               requirePermission('CAN_MANAGE_USERS'),       adminDashboardHandler)
adminRouter.get('/workflow-templates',      requirePermission('CAN_MANAGE_MASTER_DATA'), listWorkflowTemplatesHandler)
adminRouter.post('/workflow-templates',     requirePermission('CAN_MANAGE_MASTER_DATA'), createWorkflowTemplateHandler)
adminRouter.get('/workflow-templates/:id',  requirePermission('CAN_MANAGE_MASTER_DATA'), getWorkflowTemplateByIdHandler)
adminRouter.get('/sla-configs',             requirePermission('CAN_MANAGE_MASTER_DATA'), listSlaConfigsHandler)
adminRouter.post('/sla-configs',            requirePermission('CAN_MANAGE_MASTER_DATA'), createSlaConfigHandler)
adminRouter.patch('/sla-configs/:id',       requirePermission('CAN_MANAGE_MASTER_DATA'), updateSlaConfigHandler)
adminRouter.get('/audit-logs',              requirePermission('CAN_VIEW_REPORTS'),        getAuditLogsHandler)
adminRouter.get('/system-health',           requirePermission('CAN_MANAGE_USERS'),       systemHealthHandler)
