import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import * as ctrl from '../controllers/kaizens.controller.js'

export const kaizensRouter: ReturnType<typeof Router> = Router()

// Approved idea queue — anyone who can mark implemented can see the queue
kaizensRouter.get('/queue', authenticate, requirePermission('CAN_MARK_IMPLEMENTED'), ctrl.listApprovedQueue)

// Mark an idea as implemented → creates kaizen record
kaizensRouter.post('/ideas/:ideaId/mark-implemented', authenticate, requirePermission('CAN_MARK_IMPLEMENTED'), ctrl.markImplemented)

// Get a single kaizen (One Pager detail)
kaizensRouter.get('/:kaizenId', authenticate, requirePermission('CAN_SUBMIT_ONE_PAGER'), ctrl.getKaizen)

// Save One Pager draft
kaizensRouter.patch('/:kaizenId/draft', authenticate, requirePermission('CAN_SUBMIT_ONE_PAGER'), ctrl.saveDraft)

// Submit One Pager → initiates IMPLEMENTATION_APPROVAL workflow
kaizensRouter.post('/:kaizenId/submit', authenticate, requirePermission('CAN_SUBMIT_ONE_PAGER'), ctrl.submitOnePager)

// Assign implementation owner (Plant OPEX override)
kaizensRouter.patch('/:kaizenId/assign-owner', authenticate, requirePermission('CAN_ASSIGN_IMPL_OWNER'), ctrl.assignOwner)
