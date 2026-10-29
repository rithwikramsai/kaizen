import type { Response } from 'express'
import type { ApiSuccess, ApiError, PaginationMeta } from '@kiet/shared'

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
): void {
  const body: ApiSuccess<T> = { success: true, data, ...(meta ? { meta } : {}) }
  res.status(statusCode).json(body)
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown[],
): void {
  const body: ApiError = { success: false, error: { code, message, ...(details ? { details } : {}) } }
  res.status(statusCode).json(body)
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const
