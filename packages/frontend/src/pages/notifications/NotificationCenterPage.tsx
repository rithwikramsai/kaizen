import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '../../api/notifications.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  IDEA_SUBMITTED:     { label: 'Idea Submitted',      color: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
  STEP_ASSIGNED:      { label: 'Step Assigned',        color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  STEP_APPROVED:      { label: 'Step Approved',        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  STEP_RETURNED:      { label: 'Step Returned',        color: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
  IDEA_APPROVED:      { label: 'Idea Approved',        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  KAIZEN_APPROVED:    { label: 'Kaizen Approved',      color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  SLA_REMINDER:       { label: 'SLA Reminder',         color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
  SLA_ESCALATED:      { label: 'SLA Escalated',        color: 'bg-red-500/10 text-red-300 border-red-500/20' },
  REWARD_ASSIGNED:    { label: 'Reward Assigned',      color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
}

function NotifBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? { label: type, color: 'bg-white/5 text-slate-400 border-white/10' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.color}`}>
      {meta.label}
    </span>
  )
}

// ─── Entity link resolver ─────────────────────────────────────────────────────

function entityPath(n: Notification): string | null {
  if (!n.entity_id) return null
  if (n.entity_type === 'idea') return `/ideas/${n.entity_id}`
  if (n.entity_type === 'kaizen') return `/kaizens/${n.entity_id}`
  return null
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  n,
  onRead,
  isMarking,
}: {
  n: Notification
  onRead: () => void
  isMarking: boolean
}) {
  const navigate = useNavigate()
  const path = entityPath(n)

  const handleClick = () => {
    if (!n.is_read) onRead()
    if (path) navigate(path)
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0 transition-colors cursor-pointer ${
        n.is_read ? 'hover:bg-white/2' : 'bg-indigo-500/3 hover:bg-indigo-500/6'
      }`}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0">
        {n.is_read ? (
          <div className="w-2 h-2 rounded-full bg-transparent" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-indigo-400/20" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <NotifBadge type={n.notification_type} />
          <span className="text-[11px] text-slate-600 ml-auto flex-shrink-0">{timeAgo(n.created_at)}</span>
        </div>
        <p className={`text-sm font-medium ${n.is_read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
        {n.body && (
          <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
        )}
      </div>

      {/* Mark read button (only when unread) */}
      {!n.is_read && (
        <button
          onClick={(e) => { e.stopPropagation(); onRead() }}
          disabled={isMarking}
          className="flex-shrink-0 mt-1 p-1 rounded-md text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-40"
          title="Mark as read"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export function NotificationCenterPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getNotifications(page, PAGE_SIZE),
    staleTime: 15_000,
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: (id) => setMarkingId(id),
    onSettled: () => {
      setMarkingId(null)
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1
  const unreadCount = items.filter((n) => !n.is_read).length

  return (
    <PageTransition>
      <div className="max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
            <p className="text-sm text-slate-400">
              {total} total{unreadCount > 0 ? ` · ${unreadCount} unread on this page` : ''}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/25 text-indigo-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {markAllMutation.isPending ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonDetail />
        ) : isError ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load notifications.</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <p className="text-slate-300 text-base font-medium mb-1">You're all caught up</p>
            <p className="text-slate-500 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl overflow-hidden">
              {items.map((n) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  onRead={() => markOneMutation.mutate(n.id)}
                  isMarking={markingId === n.id && markOneMutation.isPending}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </PageTransition>
  )
}
