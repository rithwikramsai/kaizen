import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { z } from 'zod'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import * as svc from '../services/publicIdeas.service.js'
import { multerUpload } from './files.controller.js'

// ─── Shared error handler ─────────────────────────────────────────────────────

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
    return
  }
  console.error('[public-ideas]', err)
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
}

// ─── Employee lookup ──────────────────────────────────────────────────────────

export async function employeeLookup(req: Request, res: Response): Promise<void> {
  const employeeId = typeof req.query['employee_id'] === 'string' ? req.query['employee_id'].trim() : ''
  if (!employeeId) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'employee_id query parameter is required')
    return
  }
  try {
    const profile = await svc.lookupEmployeeById(employeeId)
    sendSuccess(res, profile)
  } catch (err) {
    handleError(res, err)
  }
}

// ─── Public master data ───────────────────────────────────────────────────────

export async function publicMasterData(_req: Request, res: Response): Promise<void> {
  try {
    const data = await svc.getPublicMasterData()
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// ─── Public file upload ───────────────────────────────────────────────────────

export const publicFileUploadMiddleware: RequestHandler = multerUpload

export async function publicFileUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'No file provided')
      return
    }
    const employeeId = (req.body as { employee_id?: string }).employee_id ?? ''
    const result = await svc.uploadPublicFile(req.file, employeeId)
    sendSuccess(res, result, 201)
  } catch (err) {
    next(err)
  }
}

// ─── Idea submission ──────────────────────────────────────────────────────────

const submitSchema = z.object({
  employee_id:          z.string().min(1, 'employee_id is required'),
  title:                z.string().min(3, 'Title must be at least 3 characters').max(200),
  plant_id:             z.string().uuid('plant_id must be a UUID'),
  zone_id:              z.string().uuid('zone_id must be a UUID'),
  department_id:        z.string().uuid('department_id must be a UUID'),
  function_id:          z.string().uuid('function_id must be a UUID'),
  hall_id:              z.string().uuid('hall_id must be a UUID'),
  location_id:          z.string().uuid('location_id must be a UUID'),
  value_stream:         z.string().min(1, 'Value Stream is required').max(255),
  category_id:          z.string().uuid('category_id must be a UUID'),
  sub_category_id:      z.string().uuid().optional(),
  problem_statement:    z.string().min(10, 'Problem statement must be at least 10 characters'),
  description:          z.string().min(10, 'Idea description must be at least 10 characters'),
  remarks:              z.string().max(1000).optional(),
  contact_email:        z.string().email('Enter a valid email').optional().or(z.literal('')),
  is_anonymous:         z.boolean().optional(),
  attachment_file_ids:  z.array(z.string().uuid()).max(5).optional(),
})

export async function publicIdeaSubmit(req: Request, res: Response): Promise<void> {
  const parsed = submitSchema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details)
    return
  }

  try {
    const result = await svc.submitIdeaAsEmployee(parsed.data)
    sendSuccess(res, result, 201)
  } catch (err) {
    handleError(res, err)
  }
}

// ─── Track idea by Registration ID ────────────────────────────────────────────

export async function trackIdea(req: Request, res: Response): Promise<void> {
  const id = typeof req.query['id'] === 'string' ? req.query['id'].trim() : ''
  if (!id) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Registration ID is required (query param: id)')
    return
  }
  try {
    const result = await svc.trackPublicIdea(id)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

// ─── QR code data ─────────────────────────────────────────────────────────────

export function getQrCode(req: Request, res: Response): void {
  const plantCode = typeof req.query['plant'] === 'string' ? req.query['plant'] : undefined
  const proto    = req.headers['x-forwarded-proto'] ?? req.protocol
  const host     = req.headers['x-forwarded-host'] ?? req.get('host') ?? 'localhost:5173'
  // Derive frontend base URL — strip /api path if proxied
  const baseUrl  = `${proto}://${host}`.replace(/\/api.*$/, '')
  const data = svc.getQrData(baseUrl, plantCode)
  sendSuccess(res, data)
}
