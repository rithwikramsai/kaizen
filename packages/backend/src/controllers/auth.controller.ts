import type { Request, Response } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service.js'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

const logoutSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
    return
  }
  console.error('[auth]', err)
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details)
    return
  }

  try {
    const result = await authService.login(parsed.data.email, parsed.data.password)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'refresh_token is required')
    return
  }

  try {
    const result = await authService.refresh(parsed.data.refresh_token)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const parsed = logoutSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'refresh_token is required')
    return
  }

  try {
    await authService.logout(parsed.data.refresh_token)
    sendSuccess(res, null)
  } catch (err) {
    handleError(res, err)
  }
}
