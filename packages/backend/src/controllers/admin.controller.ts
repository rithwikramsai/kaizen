import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import { parsePagination, buildMeta } from '../utils/pagination.js'
import {
  getAdminDashboard,
  listWorkflowTemplates,
  getWorkflowTemplateById,
  createWorkflowTemplate,
  listSlaConfigs,
  updateSlaConfig,
  createSlaConfig,
  getAuditLogs,
  getSystemHealth,
  type AuditLogFilters,
} from '../services/admin.service.js'

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
  } else {
    console.error(err)
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Unexpected error')
  }
}

export async function adminDashboardHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getAdminDashboard()
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

export async function listWorkflowTemplatesHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await listWorkflowTemplates()
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getWorkflowTemplateByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string }
    const data = await getWorkflowTemplateById(id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

export async function listSlaConfigsHandler(req: Request, res: Response): Promise<void> {
  try {
    const plantId = typeof req.query['plant_id'] === 'string' ? req.query['plant_id'] : undefined
    const data = await listSlaConfigs(plantId)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

export async function updateSlaConfigHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string }
    const slaHours = Number((req.body as { sla_hours?: unknown }).sla_hours)
    if (!Number.isInteger(slaHours) || slaHours <= 0) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'sla_hours must be a positive integer')
      return
    }
    const data = await updateSlaConfig(id, slaHours)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getAuditLogsHandler(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query as Record<string, unknown>
    const filters: AuditLogFilters = {
      from_date:   typeof q['from_date']   === 'string' ? q['from_date']   : undefined,
      to_date:     typeof q['to_date']     === 'string' ? q['to_date']     : undefined,
      action:      typeof q['action']      === 'string' ? q['action']      : undefined,
      entity_type: typeof q['entity_type'] === 'string' ? q['entity_type'] : undefined,
      actor_id:    typeof q['actor_id']    === 'string' ? q['actor_id']    : undefined,
    }
    const pagination = parsePagination(q)
    const result = await getAuditLogs(filters, pagination)
    sendSuccess(res, result.rows, 200, buildMeta(pagination.page, pagination.pageSize, result.total))
  } catch (err) {
    handleError(res, err)
  }
}

export async function systemHealthHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getSystemHealth()
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

export async function createWorkflowTemplateHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as { workflow_type?: unknown; name?: unknown }
  if (typeof body.workflow_type !== 'string' || !body.workflow_type.trim()) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'workflow_type is required')
    return
  }
  if (typeof body.name !== 'string' || !body.name.trim()) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'name is required')
    return
  }
  try {
    const data = await createWorkflowTemplate({ workflow_type: body.workflow_type.trim(), name: body.name.trim() })
    sendSuccess(res, data, 201)
  } catch (err) {
    handleError(res, err)
  }
}

export async function createSlaConfigHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    plant_id?: unknown; stage_code?: unknown; workflow_type?: unknown
    sla_hours?: unknown; reminder_hrs?: unknown
  }
  if (typeof body.plant_id !== 'string' || !body.plant_id) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'plant_id is required'); return
  }
  if (typeof body.stage_code !== 'string' || !body.stage_code.trim()) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'stage_code is required'); return
  }
  if (typeof body.workflow_type !== 'string' || !body.workflow_type.trim()) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'workflow_type is required'); return
  }
  const slaHours = Number(body.sla_hours)
  if (!Number.isInteger(slaHours) || slaHours <= 0) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'sla_hours must be a positive integer'); return
  }
  const reminderHrs = body.reminder_hrs != null ? Number(body.reminder_hrs) : undefined
  if (reminderHrs !== undefined && (!Number.isInteger(reminderHrs) || reminderHrs <= 0)) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'reminder_hrs must be a positive integer'); return
  }
  try {
    const data = await createSlaConfig({
      plant_id: body.plant_id,
      stage_code: body.stage_code.trim().toUpperCase(),
      workflow_type: body.workflow_type.trim().toUpperCase(),
      sla_hours: slaHours,
      reminder_hrs: reminderHrs,
    })
    sendSuccess(res, data, 201)
  } catch (err) {
    handleError(res, err)
  }
}
