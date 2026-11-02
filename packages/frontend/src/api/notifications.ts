import { authFetch } from './client.js'

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

export function getNotifications(page = 1, pageSize = 20): Promise<NotificationPage> {
  return authFetch<NotificationPage>(`/notifications?page=${page}&page_size=${pageSize}`)
}

export function getUnreadCount(): Promise<{ count: number }> {
  return authFetch<{ count: number }>('/notifications/unread-count')
}

export function markNotificationRead(id: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return authFetch<{ updated: number }>('/notifications/read-all', { method: 'PATCH' })
}
