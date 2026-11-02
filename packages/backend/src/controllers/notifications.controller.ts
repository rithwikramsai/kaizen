import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../services/notifications.service.js'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
  } else {
    console.error('Notifications controller error:', err)
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  }
}

// GET /notifications?page=1&page_size=20
export async function listNotifications(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query['page'] as string | undefined) ?? '1', 10) || 1)
    const rawSize = parseInt((req.query['page_size'] as string | undefined) ?? String(DEFAULT_PAGE_SIZE), 10)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, isNaN(rawSize) ? DEFAULT_PAGE_SIZE : rawSize))

    const result = await getNotifications(req.user!.id, page, pageSize)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /notifications/unread-count
export async function unreadCount(req: Request, res: Response): Promise<void> {
  try {
    const result = await getUnreadCount(req.user!.id)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}

// PATCH /notifications/:id/read
export async function markOneRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    if (!id) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Notification id is required')
      return
    }
    await markRead(id, req.user!.id)
    sendSuccess(res, { message: 'Notification marked as read' })
  } catch (err) {
    handleError(res, err)
  }
}

// PATCH /notifications/read-all
export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const result = await markAllRead(req.user!.id)
    sendSuccess(res, result)
  } catch (err) {
    handleError(res, err)
  }
}
