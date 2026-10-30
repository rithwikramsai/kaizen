import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import {
  initiateIdeaWorkflow,
  initiateKaizenWorkflow,
  processIdeaAction,
  processKaizenAction,
  getIdeaWorkflowStatus,
  getKaizenWorkflowStatus,
  getMyQueue,
} from '../controllers/workflow.controller.js'

export const workflowRouter: ReturnType<typeof Router> = Router()

workflowRouter.use(authenticate)

// Review queue — items currently assigned to the authenticated user
workflowRouter.get('/my-queue', requirePermission('CAN_APPROVE_IDEA'), getMyQueue)

// Idea workflow
workflowRouter.post('/ideas/:ideaId/initiate', requirePermission('CAN_SUBMIT_IDEA'), initiateIdeaWorkflow)
workflowRouter.post('/ideas/:ideaId/action', requirePermission('CAN_APPROVE_IDEA'), processIdeaAction)
workflowRouter.get('/ideas/:ideaId/status', requirePermission('CAN_VIEW_ZONE_IDEAS'), getIdeaWorkflowStatus)

// Kaizen workflow
workflowRouter.post('/kaizens/:kaizenId/initiate', requirePermission('CAN_REVIEW_IMPLEMENTATION'), initiateKaizenWorkflow)
workflowRouter.post('/kaizens/:kaizenId/action', requirePermission('CAN_REVIEW_IMPLEMENTATION'), processKaizenAction)
workflowRouter.get('/kaizens/:kaizenId/status', requirePermission('CAN_VIEW_ZONE_IDEAS'), getKaizenWorkflowStatus)
