import { pool } from '../config/database.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  notification_type: string
  title: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationPage {
  items: Notification[]
  total: number
  page: number
  page_size: number
}

// ─── Get notifications (paginated) ───────────────────────────────────────────

export async function getNotifications(
  recipientId: string,
  page: number,
  pageSize: number,
): Promise<NotificationPage> {
  const offset = (page - 1) * pageSize

  const [rowsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT id, notification_type, title, body, entity_type, entity_id,
              is_read, read_at, created_at
       FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [recipientId, pageSize, offset],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE recipient_id = $1`,
      [recipientId],
    ),
  ])

  return {
    items: rowsResult.rows.map((r) => ({
      id: r.id as string,
      notification_type: r.notification_type as string,
      title: r.title as string,
      body: r.body as string | null,
      entity_type: r.entity_type as string | null,
      entity_id: r.entity_id as string | null,
      is_read: r.is_read as boolean,
      read_at: r.read_at ? (r.read_at as Date).toISOString() : null,
      created_at: (r.created_at as Date).toISOString(),
    })),
    total: (countResult.rows[0] as { total: number }).total,
    page,
    page_size: pageSize,
  }
}

// ─── Unread count ─────────────────────────────────────────────────────────────

export async function getUnreadCount(recipientId: string): Promise<{ count: number }> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id = $1 AND is_read = FALSE`,
    [recipientId],
  )
  return { count: (res.rows[0] as { count: number }).count }
}

// ─── Mark single notification read ───────────────────────────────────────────

export async function markRead(notificationId: string, recipientId: string): Promise<void> {
  const res = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE id = $1 AND recipient_id = $2 AND is_read = FALSE
     RETURNING id`,
    [notificationId, recipientId],
  )
  if (!res.rows[0]) {
    const exists = await pool.query(
      `SELECT id FROM notifications WHERE id = $1`,
      [notificationId],
    )
    if (!exists.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Notification not found')
  }
}

// ─── Mark all read ────────────────────────────────────────────────────────────

export async function markAllRead(recipientId: string): Promise<{ updated: number }> {
  const res = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE recipient_id = $1 AND is_read = FALSE
     RETURNING id`,
    [recipientId],
  )
  return { updated: res.rowCount ?? 0 }
}
