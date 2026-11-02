import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs, type AuditLogRow } from '../../api/admin.js'
import { PageTransition } from '../../components/PageTransition.js'

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_OPTIONS = [
  'IDEA_SUBMITTED', 'IDEA_APPROVED', 'IDEA_REJECTED',
  'IMPLEMENTATION_STARTED', 'IMPLEMENTATION_COMPLETED',
  'REWARD_ASSIGNED', 'USER_DEACTIVATED', 'SLA_CONFIG_UPDATED',
]

const ENTITY_OPTIONS = ['idea', 'kaizen', 'user', 'reward', 'sla_config', 'nomination']

function LogRow({ row, isLast }: { row: AuditLogRow; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className={`cursor-pointer hover:bg-white/3 transition-all ${!isLast ? 'border-b border-white/5' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDateTime(row.performed_at)}</td>
        <td className="px-5 py-3">
          <span className="inline-flex px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium rounded font-mono">
            {row.action}
          </span>
        </td>
        <td className="px-5 py-3 text-slate-400 text-xs">{row.entity_type}</td>
        <td className="px-5 py-3 text-slate-300 text-sm">{row.actor_name ?? row.performed_by ?? '—'}</td>
        <td className="px-5 py-3 text-slate-500 text-[10px] font-mono truncate max-w-[120px]">{row.entity_id}</td>
        <td className="px-5 py-3 text-right text-slate-600 text-xs">{row.payload ? (expanded ? '▲' : '▼') : ''}</td>
      </tr>
      {expanded && row.payload && (
        <tr className={!isLast ? 'border-b border-white/5' : ''}>
          <td colSpan={6} className="px-5 pb-3">
            <pre className="bg-white/3 rounded-lg p-3 text-[11px] text-slate-400 font-mono overflow-x-auto">
              {JSON.stringify(row.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

export function AuditLogViewerPage() {
  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')

  const PAGE_SIZE = 25

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-audit-logs', page, fromDate, toDate, action, entityType],
    queryFn: () => fetchAuditLogs({
      page,
      page_size: PAGE_SIZE,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      action: action || undefined,
      entity_type: entityType || undefined,
    }),
    staleTime: 30_000,
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  const resetFilters = () => {
    setFromDate(''); setToDate(''); setAction(''); setEntityType(''); setPage(1)
  }

  return (
    <PageTransition>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Audit Log</h1>
          <p className="text-sm text-slate-400">Paginated, filterable record of all platform actions</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1) }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1) }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-w-[180px]"
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Entity Type</label>
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">All types</option>
              {ENTITY_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 text-xs rounded-lg hover:bg-white/10 transition-all"
          >
            Reset
          </button>
        </div>

        {isLoading && (
          <div className="glass rounded-2xl overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4 border-b border-white/5 animate-pulse">
                <div className="h-4 w-32 bg-white/5 rounded" />
                <div className="h-4 w-40 bg-white/5 rounded" />
                <div className="h-4 w-24 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load audit logs.
          </div>
        )}

        {data && data.rows.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400">No audit log entries match the current filters</p>
          </div>
        )}

        {data && data.rows.length > 0 && (
          <>
            <div className="glass rounded-2xl overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Timestamp</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Action</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Entity</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Actor</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Entity ID</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, idx) => (
                    <LogRow key={row.id} row={row} isLast={idx === data.rows.length - 1} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{data.total} total entries</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all"
                >
                  Prev
                </button>
                <span className="text-slate-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
