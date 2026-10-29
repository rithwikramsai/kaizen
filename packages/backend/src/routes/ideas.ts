import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import * as ctrl from '../controllers/ideas.controller.js'

export const ideasRouter: ReturnType<typeof Router> = Router()

ideasRouter.get('/', authenticate, requirePermission('CAN_VIEW_OWN_IDEAS'), ctrl.listIdeas)
ideasRouter.post('/', authenticate, requirePermission('CAN_SUBMIT_IDEA'), ctrl.createIdea)
ideasRouter.get('/:id', authenticate, requirePermission('CAN_VIEW_OWN_IDEAS'), ctrl.getIdea)
ideasRouter.put('/:id', authenticate, requirePermission('CAN_SUBMIT_IDEA'), ctrl.updateIdea)
ideasRouter.delete('/:id', authenticate, requirePermission('CAN_SUBMIT_IDEA'), ctrl.deleteIdea)
ideasRouter.get('/:id/timeline', authenticate, requirePermission('CAN_VIEW_OWN_IDEAS'), ctrl.getTimeline)
