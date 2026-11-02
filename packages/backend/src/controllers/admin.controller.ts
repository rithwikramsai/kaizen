import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import { parsePagination } from '../utils/pagination.js'
import {
  getAdminDashboard,
  listWorkflowTemplates,
  getWorkflowTemplateById,
  listSlaConfigs,
  updateSlaConfig,
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
    sendSuccess(res, result)
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
