import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listIdeas } from '../../api/ideas.js'
import { EmptyState } from '../../components/EmptyState.js'
import { SkeletonCard } from '../../components/Skeleton.js'
import { PageTransition } from '../../components/PageTransition.js'

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  SUBMITTED: { label: 'Submitted', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20',   dot: 'bg-amber-400' },
  APPROVED:  { label: 'Approved',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-500/15 text-red-400 border-red-500/20',         dot: 'bg-red-400' },
  DRAFT:     { label: 'Draft',     cls: 'bg-slate-500/15 text-slate-400 border-slate-500/20',   dot: 'bg-slate-400' },
}

const STATUSES = [
  { value: '',          label: 'All' },
  { value: 'DRAFT',     label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED',  label: 'Approved' },
  { value: 'REJECTED',  label: 'Rejected' },
]

function GridIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function IdeasListPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['all-ideas', page, statusFilter],
    queryFn: () =>
      listIdeas({
        page,
        page_size: 12,
        sort_by: 'created_at',
        sort_dir: 'desc',
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  })

  const ideas = data?.data ?? []
  const meta = data?.meta

  return (
    <PageTransition>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">All Ideas</h1>
            <p className="text-sm text-slate-400 mt-0.5">Browse all kaizen ideas across the plant</p>
          </div>
          {meta && (
            <div className="glass px-3 py-1.5 rounded-xl text-sm text-slate-400">
              <span className="text-white font-semibold">{meta.total}</span> total
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1) }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                statusFilter === s.value
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : ideas.length === 0 ? (
          <EmptyState
            icon={<GridIcon />}
            title="No ideas found"
            description={statusFilter ? `No ideas with status "${statusFilter}".` : 'No ideas have been submitted yet.'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea) => {
                const sc = STATUS_CONFIG[idea.status] ?? STATUS_CONFIG['DRAFT']!
                return (
                  <Link
                    key={idea.id}
                    to={`/ideas/${idea.id}`}
                    className="group glass rounded-2xl p-5 flex flex-col gap-3 hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-md">
                        {idea.registration_id ?? 'DRAFT'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${sc.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2 flex-1">
                      {idea.title}
                    </h3>

                    <p className="text-[11px] text-slate-400 font-medium">
                      {idea.submitted_by?.full_name ?? 'Anonymous'}
                    </p>

                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500">
                      {idea.category?.name && <span>{idea.category.name}</span>}
                      {idea.zone?.name && <span>· {idea.zone.name}</span>}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[11px] text-slate-500">
                        {idea.submitted_at
                          ? new Date(idea.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Draft'}
                      </span>
                      <span className="text-slate-500 group-hover:text-indigo-400 transition-colors">
                        <ChevronRightIcon />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {meta && meta.total > meta.page_size && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-500">Showing {ideas.length} of {meta.total}</p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 text-sm text-slate-300 glass rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= Math.ceil(meta.total / meta.page_size)}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 text-sm text-slate-300 glass rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
