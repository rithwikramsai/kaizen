import type { Request, Response, NextFunction } from 'express'
import { sendError, ErrorCodes } from '../utils/response.js'
import type { Permission } from '@kiet/shared'

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, ErrorCodes.UNAUTHENTICATED, 'Not authenticated')
      return
    }
    if (!req.user.permissions.includes(permission)) {
      sendError(res, 403, ErrorCodes.FORBIDDEN, `Permission required: ${permission}`)
      return
    }
    next()
  }
}

// Passes if the authenticated user holds at least one of the listed permissions.
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, ErrorCodes.UNAUTHENTICATED, 'Not authenticated')
      return
    }
    if (!permissions.some((p) => req.user!.permissions.includes(p))) {
      sendError(res, 403, ErrorCodes.FORBIDDEN, `One of these permissions required: ${permissions.join(', ')}`)
      return
    }
    next()
  }
}
