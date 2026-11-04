import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission, requireAnyPermission } from '../middleware/requirePermission.js'
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

// Review queue — items assigned to the authenticated user across all reviewer roles (C1)
workflowRouter.get(
  '/my-queue',
  requireAnyPermission('CAN_APPROVE_IDEA', 'CAN_REVIEW_SAFETY', 'CAN_REVIEW_QUALITY', 'CAN_REVIEW_SME', 'CAN_REVIEW_IMPLEMENTATION'),
  getMyQueue,
)

// Idea workflow
workflowRouter.post('/ideas/:ideaId/initiate', requirePermission('CAN_SUBMIT_IDEA'), initiateIdeaWorkflow)
// Action: allow all roles that can be assigned as a reviewer at any stage (C1)
workflowRouter.post(
  '/ideas/:ideaId/action',
  requireAnyPermission('CAN_APPROVE_IDEA', 'CAN_REVIEW_SAFETY', 'CAN_REVIEW_QUALITY', 'CAN_REVIEW_SME'),
  processIdeaAction,
)
// Status: accessible to anyone who can view or act on ideas — submitter, zone/plant/all viewers, reviewers (C2)
workflowRouter.get(
  '/ideas/:ideaId/status',
  requireAnyPermission(
    'CAN_VIEW_OWN_IDEAS', 'CAN_VIEW_ZONE_IDEAS', 'CAN_VIEW_PLANT_IDEAS', 'CAN_VIEW_ALL_IDEAS',
    'CAN_APPROVE_IDEA', 'CAN_REVIEW_SAFETY', 'CAN_REVIEW_QUALITY', 'CAN_REVIEW_SME',
  ),
  getIdeaWorkflowStatus,
)

// Kaizen workflow
workflowRouter.post('/kaizens/:kaizenId/initiate', requirePermission('CAN_REVIEW_IMPLEMENTATION'), initiateKaizenWorkflow)
// Action: also allows CAN_UPLOAD_SCI_TECH so HOD can complete the SCI_TECH_UPLOAD step (M1/L6)
workflowRouter.post(
  '/kaizens/:kaizenId/action',
  requireAnyPermission('CAN_REVIEW_IMPLEMENTATION', 'CAN_UPLOAD_SCI_TECH'),
  processKaizenAction,
)
// Status: accessible to anyone who can view or act on kaizens (C2 — same pattern)
workflowRouter.get(
  '/kaizens/:kaizenId/status',
  requireAnyPermission(
    'CAN_VIEW_OWN_IDEAS', 'CAN_VIEW_ZONE_IDEAS', 'CAN_VIEW_PLANT_IDEAS', 'CAN_VIEW_ALL_IDEAS',
    'CAN_REVIEW_IMPLEMENTATION', 'CAN_SUBMIT_ONE_PAGER',
  ),
  getKaizenWorkflowStatus,
)
