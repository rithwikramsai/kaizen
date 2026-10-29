import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { sendError, ErrorCodes } from '../utils/response.js'
import type { JwtPayload, AuthenticatedUser } from '@kiet/shared'

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, ErrorCodes.UNAUTHENTICATED, 'Missing or invalid Authorization header')
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = {
      id: payload.sub,
      email: payload.email,
      full_name: '',
      plant_id: payload.plant_id,
      permissions: payload.permissions,
    }
    next()
  } catch {
    sendError(res, 401, ErrorCodes.UNAUTHENTICATED, 'Invalid or expired token')
  }
}
