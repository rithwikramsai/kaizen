import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import * as ctrl from '../controllers/notifications.controller.js'

export const notificationsRouter: ReturnType<typeof Router> = Router()

// All notification routes require authentication only — notifications are
// scoped to the authenticated user, so no additional permission gate needed.

notificationsRouter.get('/', authenticate, ctrl.listNotifications)
notificationsRouter.get('/unread-count', authenticate, ctrl.unreadCount)

// read-all MUST come before /:id/read so Express does not treat "read-all" as an id
notificationsRouter.patch('/read-all', authenticate, ctrl.markAllAsRead)
notificationsRouter.patch('/:id/read', authenticate, ctrl.markOneRead)
