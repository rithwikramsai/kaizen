import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import {
  initiateWorkflow,
  processWorkflowAction,
  getWorkflowStatus,
  getMyReviewQueue,
} from '../services/workflow.service.js'

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
  } else {
    console.error('Workflow controller error:', err)
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  }
}

// POST /workflow/ideas/:ideaId/initiate
export async function initiateIdeaWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { ideaId } = req.params
    const { plant_id, safety_review_required, qms_review_required, machine_design_change } = req.body
    const actorId = req.user!.id
    const plantId: string = plant_id ?? req.user!.plant_id

    const result = await initiateWorkflow({
      workflowType: 'IDEA_APPROVAL',
      entityType: 'idea',
      entityId: ideaId!,
      plantId,
      initiatedBy: actorId,
      submitterId: actorId,
      inheritedFlags: {
        machine_design_change: Boolean(machine_design_change),
        safety_review_required: Boolean(safety_review_required),
        qms_review_required: Boolean(qms_review_required),
        sci_tech_required: false,
      },
    })

    sendSuccess(res, result, 201)
  } catch (err) {
    handleError(res, err)
  }
}

// POST /workflow/kaizens/:kaizenId/initiate
export async function initiateKaizenWorkflow(req: Request, res: Response): Promise<void> {
  try {
    const { kaizenId } = req.params
    const {
      plant_id,
      machine_design_change,
      safety_review_required,
      qms_review_required,
      sci_tech_required,
    } = req.body
    const actorId = req.user!.id
    const plantId: string = plant_id ?? req.user!.plant_id

    const result = await initiateWorkflow({
      workflowType: 'IMPLEMENTATION_APPROVAL',
      entityType: 'kaizen',
      entityId: kaizenId!,
      plantId,
      initiatedBy: actorId,
      submitterId: actorId,
      inheritedFlags: {
        machine_design_change: Boolean(machine_design_change),
        safety_review_required: Boolean(safety_review_required),
        qms_review_required: Boolean(qms_review_required),
        sci_tech_required: Boolean(sci_tech_required),
      },
    })

    sendSuccess(res, result, 201)
  } catch (err) {
    handleError(res, err)
  }
}

// POST /workflow/ideas/:ideaId/action
export async function processIdeaAction(req: Request, res: Response): Promise<void> {
  try {
    const { ideaId } = req.params
    const { action, comment, flags } = req.body
    const actorId = req.user!.id

    if (!action) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'action is required')
      return
    }

    const result = await processWorkflowAction({
      entityType: 'idea',
      entityId: ideaId!,
      actorId,
      action: String(action).toUpperCase(),
      comment,
      flags,
    })

    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

// POST /workflow/kaizens/:kaizenId/action
export async function processKaizenAction(req: Request, res: Response): Promise<void> {
  try {
    const { kaizenId } = req.params
    const body = req.body as {
      action: string
      comment?: string
      flags?: Record<string, boolean>
      sciTechFlag?: boolean
      sci_tech_required?: boolean
      hod_business_impact?: number
      hod_sustenance?: number
      hod_innovation?: number
      hod_bpr_recommendation?: boolean
      sme_bpr_recommendation?: boolean
    }
    const { action, comment, flags } = body
    const actorId = req.user!.id

    if (!action) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'action is required')
      return
    }

    const hodRatings = (body.hod_business_impact && body.hod_sustenance && body.hod_innovation)
      ? {
          businessImpact: body.hod_business_impact as 1 | 3 | 5,
          sustenance: body.hod_sustenance as 1 | 3 | 5,
          innovation: body.hod_innovation as 1 | 3 | 5,
          bprRecommendation: body.hod_bpr_recommendation ?? false,
        }
      : undefined

    const result = await processWorkflowAction({
      entityType: 'kaizen',
      entityId: kaizenId!,
      actorId,
      action: String(action).toUpperCase(),
      comment,
      flags,
      sciTechFlag: Boolean(body.sciTechFlag ?? body.sci_tech_required),
      hodRatings,
      smeBprRecommendation: body.sme_bpr_recommendation,
    })

    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /workflow/ideas/:ideaId/status
export async function getIdeaWorkflowStatus(req: Request, res: Response): Promise<void> {
  try {
    const { ideaId } = req.params
    const result = await getWorkflowStatus('idea', ideaId!)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /workflow/kaizens/:kaizenId/status
export async function getKaizenWorkflowStatus(req: Request, res: Response): Promise<void> {
  try {
    const { kaizenId } = req.params
    const result = await getWorkflowStatus('kaizen', kaizenId!)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /workflow/my-queue?status=PENDING|APPROVED|RETURNED|REJECTED
export async function getMyQueue(req: Request, res: Response): Promise<void> {
  try {
    const actorId = req.user!.id
    const allowed = new Set(['PENDING', 'APPROVED', 'RETURNED', 'REJECTED'])
    const status  = typeof req.query['status'] === 'string' && allowed.has(req.query['status'])
      ? req.query['status']
      : 'PENDING'
    const result = await getMyReviewQueue(actorId, status)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}
