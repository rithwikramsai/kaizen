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
