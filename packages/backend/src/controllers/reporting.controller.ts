import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import { getDashboard } from '../services/reporting.service.js'

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
  } else {
    console.error('Reporting controller error:', err)
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  }
}

// GET /reports/dashboard
export async function dashboard(req: Request, res: Response): Promise<void> {
  try {
    const data = await getDashboard(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}
