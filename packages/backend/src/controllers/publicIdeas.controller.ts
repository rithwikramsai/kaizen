import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import {
  lookupEmployeeById,
  getPublicMasterData,
  submitIdeaAsEmployee,
} from '../services/publicIdeas.service.js'

// ─── GET /public/employee-lookup?employee_id=EMP001 ───────────────────────────

export async function employeeLookup(req: Request, res: Response): Promise<void> {
  try {
    const employeeId = typeof req.query.employee_id === 'string' ? req.query.employee_id.trim() : ''
    if (!employeeId) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'employee_id query param is required')
      return
    }
    const profile = await lookupEmployeeById(employeeId)
    sendSuccess(res, profile)
  } catch (err) {
    if (err instanceof ServiceError) {
      sendError(res, err.httpStatus, err.code, err.message)
    } else {
      sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Internal server error')
    }
  }
}

// ─── GET /public/master-data ──────────────────────────────────────────────────

export async function publicMasterData(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getPublicMasterData()
    sendSuccess(res, data)
  } catch (err) {
    if (err instanceof ServiceError) {
      sendError(res, err.httpStatus, err.code, err.message)
    } else {
      sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Internal server error')
    }
  }
}

// ─── POST /public/idea-submit ─────────────────────────────────────────────────

export async function publicIdeaSubmit(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>

    const employee_id     = typeof body.employee_id     === 'string' ? body.employee_id.trim()     : ''
    const plant_id        = typeof body.plant_id        === 'string' ? body.plant_id.trim()        : ''
    const zone_id         = typeof body.zone_id         === 'string' ? body.zone_id.trim()         : ''
    const department_id   = typeof body.department_id   === 'string' ? body.department_id.trim()   : ''
    const category_id     = typeof body.category_id     === 'string' ? body.category_id.trim()     : ''
    const problem_statement = typeof body.problem_statement === 'string' ? body.problem_statement.trim() : ''
    const description     = typeof body.description     === 'string' ? body.description.trim()     : ''

    if (!employee_id)     { sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'employee_id is required'); return }
    if (!plant_id)        { sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'plant_id is required'); return }
    if (!zone_id)         { sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'zone_id is required'); return }
    if (!department_id)   { sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'department_id is required'); return }
    if (!category_id)     { sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'category_id is required'); return }
    if (!problem_statement) { sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'problem_statement is required'); return }
    if (!description)     { sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'description is required'); return }

    const str = (v: unknown) => typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
    const attachment_file_ids = Array.isArray(body.attachment_file_ids)
      ? (body.attachment_file_ids as unknown[]).filter((x): x is string => typeof x === 'string')
      : undefined

    const result = await submitIdeaAsEmployee({
      employee_id,
      plant_id,
      zone_id,
      department_id,
      function_id:    str(body.function_id),
      hall_id:        str(body.hall_id),
      location_id:    str(body.location_id),
      value_stream:   str(body.value_stream),
      category_id,
      sub_category_id: str(body.sub_category_id),
      problem_statement,
      description,
      remarks:        str(body.remarks),
      is_anonymous:   body.is_anonymous === true,
      attachment_file_ids,
    })

    sendSuccess(res, result)
  } catch (err) {
    if (err instanceof ServiceError) {
      sendError(res, err.httpStatus, err.code, err.message)
    } else {
      sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Submission failed')
    }
  }
}
