import type { Request, Response } from 'express'
import { z } from 'zod'
import * as usersService from '../services/users.service.js'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import { parsePagination, buildMeta } from '../utils/pagination.js'

const createUserSchema = z.object({
  employee_id: z.string().min(1).max(50),
  email: z.string().email(),
  full_name: z.string().min(1).max(255),
  phone: z.string().max(20).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  plant_id: z.string().uuid().optional(),
  role_id: z.string().uuid().optional(),
})

const updateUserSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
})

const assignRoleSchema = z.object({
  role_id: z.string().uuid(),
  plant_id: z.string().uuid(),
})

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
    return
  }
  console.error('[users]', err)
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined
    const { rows, total } = await usersService.listUsers(pagination, search)
    sendSuccess(res, rows, 200, buildMeta(pagination.page, pagination.pageSize, total))
  } catch (err) {
    handleError(res, err)
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details)
    return
  }

  try {
    const user = await usersService.createUser({
      ...parsed.data,
      granted_by: req.user!.id,
    })
    sendSuccess(res, user, 201)
  } catch (err) {
    handleError(res, err)
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const parsed = updateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details)
    return
  }

  try {
    const user = await usersService.updateUser(req.params['id']!, parsed.data)
    sendSuccess(res, user)
  } catch (err) {
    handleError(res, err)
  }
}

export async function deactivateUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await usersService.deactivateUser(req.params['id']!)
    sendSuccess(res, user)
  } catch (err) {
    handleError(res, err)
  }
}

export async function assignRole(req: Request, res: Response): Promise<void> {
  const parsed = assignRoleSchema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details)
    return
  }

  try {
    await usersService.assignRole(
      req.params['id']!,
      parsed.data.role_id,
      parsed.data.plant_id,
      req.user!.id,
    )
    sendSuccess(res, { message: 'Role assigned successfully' })
  } catch (err) {
    handleError(res, err)
  }
}

export async function revokeRole(req: Request, res: Response): Promise<void> {
  try {
    await usersService.revokeRole(req.params['id']!, req.params['role_id']!)
    sendSuccess(res, null)
  } catch (err) {
    handleError(res, err)
  }
}

export async function listRoles(_req: Request, res: Response): Promise<void> {
  try {
    const roles = await usersService.listRoles()
    sendSuccess(res, roles)
  } catch (err) {
    handleError(res, err)
  }
}

export async function listPermissions(_req: Request, res: Response): Promise<void> {
  try {
    const permissions = await usersService.listPermissions()
    sendSuccess(res, permissions)
  } catch (err) {
    handleError(res, err)
  }
}
