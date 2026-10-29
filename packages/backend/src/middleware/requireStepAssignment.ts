import type { Request, Response, NextFunction } from 'express'
import { pool } from '../config/database.js'
import { sendError, ErrorCodes } from '../utils/response.js'

export function requireStepAssignment(workflowStepIdParam: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 401, ErrorCodes.UNAUTHENTICATED, 'Not authenticated')
      return
    }

    const stepId = req.params[workflowStepIdParam]
    if (!stepId) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, `Missing param: ${workflowStepIdParam}`)
      return
    }

    const result = await pool.query<{ assigned_user_id: string; status: string }>(
      `SELECT assigned_user_id, status FROM workflow_steps WHERE id = $1`,
      [stepId],
    )

    const step = result.rows[0]
    if (!step) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Workflow step not found')
      return
    }
    if (step.assigned_user_id !== req.user.id) {
      sendError(res, 403, ErrorCodes.FORBIDDEN, 'You are not the assigned approver for this step')
      return
    }
    if (step.status !== 'PENDING') {
      sendError(res, 422, ErrorCodes.WORKFLOW_ERROR, `Step is not pending (current status: ${step.status})`)
      return
    }

    next()
  }
}
