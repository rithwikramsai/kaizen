import type { Request, Response } from 'express'
import { z } from 'zod'
import * as authService from '../services/auth.service.js'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import { sendEmailForEvent } from '../services/email/email.service.js'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
})

const logoutSchema = z.object({
  refresh_token: z.string().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(1, 'Password is required'),
})

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(1, 'New password is required'),
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
  const parsed = logoutSchema.safeParse(req.body ?? {})
  const refreshToken = parsed.success ? (parsed.data.refresh_token ?? '') : ''

  try {
    if (refreshToken) {
      await authService.logout(refreshToken)
    }
    sendSuccess(res, null)
  } catch (err) {
    handleError(res, err)
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Valid email is required')
    return
  }

  try {
    const { resetUrl } = await authService.forgotPassword(parsed.data.email)
    if (resetUrl) {
      void sendEmailForEvent('PASSWORD_RESET', parsed.data.email, { entityId: resetUrl })
    }
    // Always respond with 200 — no email enumeration
    sendSuccess(res, { message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    handleError(res, err)
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'token and password are required')
    return
  }

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password)
    sendSuccess(res, { message: 'Password reset successfully.' })
  } catch (err) {
    handleError(res, err)
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'current_password and new_password are required')
    return
  }

  try {
    await authService.changePassword(req.user!.id, parsed.data.current_password, parsed.data.new_password)
    sendSuccess(res, { message: 'Password changed successfully.' })
  } catch (err) {
    handleError(res, err)
  }
}
