import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyReviewQueue, type ReviewQueueItem } from '../../api/ideas.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

const STAGE_LABELS: Record<string, string> = {
  ZONE_LEADER_REVIEW: 'Zone Leader Review',
  HOD_REVIEW: 'HOD Review',
  SAFETY_REVIEW: 'Safety Review',
  QUALITY_REVIEW: 'Quality Review',
  SME_REVIEW: 'SME Review',
  SCI_TECH_UPLOAD: 'Sci-Tech Upload',
  IMPL_HOD_REVIEW: 'Impl. HOD Review',
  IMPL_SAFETY_REVIEW: 'Impl. Safety Review',
  IMPL_QUALITY_REVIEW: 'Impl. Quality Review',
  IMPL_MACHINE_DESIGN_REVIEW: 'Machine Design Review',
}

function stageLabel(code: string) {
  return STAGE_LABELS[code] ?? code.replace(/_/g, ' ')
}

function isOverdue(sla: string | null) {
  if (!sla) return false
  return new Date(sla) < new Date()
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function ReviewQueuePage() {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-review-queue'],
    queryFn: getMyReviewQueue,
    staleTime: 30_000,
  })

  const items = data ?? []
  const overdue = items.filter((i) => isOverdue(i.sla_due_at))
  const ideas = items.filter((i) => i.entity_type === 'idea')
  const kaizens = items.filter((i) => i.entity_type === 'kaizen')

  function handleReview(item: ReviewQueueItem) {
    if (item.entity_type === 'idea') {
      navigate(`/ideas/${item.entity_id}`)
    } else {
      navigate(`/kaizens/${item.entity_id}`)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Review Queue</h1>
          <p className="text-sm text-slate-400">Ideas and kaizens assigned to you for approval</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Pending" value={items.length} color="indigo" />
          <KpiCard label="Overdue" value={overdue.length} color={overdue.length > 0 ? 'red' : 'slate'} />
          <KpiCard label="Ideas" value={ideas.length} color="amber" />
          <KpiCard label="Kaizens" value={kaizens.length} color="emerald" />
        </div>

        {/* Table */}
        {isLoading ? (
          <SkeletonDetail />
        ) : isError ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load review queue.
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 text-base font-medium mb-1">All clear</p>
            <p className="text-slate-500 text-sm">No items are currently assigned to you for review.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  <th className="px-5 py-3 text-left">Reg. No</th>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Submitter</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">Plant / Zone</th>
                  <th className="px-5 py-3 text-left">Stage</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">SLA Due</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const overdueTx = isOverdue(item.sla_due_at)
                  return (
                    <tr
                      key={`${item.entity_type}-${item.entity_id}`}
                      className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] text-slate-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-md">
                          {item.registration_id ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <p className="text-white font-medium truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 capitalize">{item.entity_type}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 hidden sm:table-cell">
                        {item.submitted_by_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">
                        <span>{item.plant_name ?? '—'}</span>
                        {item.zone_name && <span className="text-slate-600"> / {item.zone_name}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                          {stageLabel(item.stage_code)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`flex items-center gap-1.5 text-[11px] ${overdueTx ? 'text-red-400' : 'text-slate-400'}`}>
                          <ClockIcon />
                          {formatDate(item.sla_due_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleReview(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-medium rounded-lg transition-all"
                        >
                          Review <ArrowIcon />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: 'indigo' | 'red' | 'amber' | 'emerald' | 'slate' }) {
  const colors = {
    indigo:  'bg-indigo-500/10  border-indigo-500/20  text-indigo-300',
    red:     'bg-red-500/10     border-red-500/20     text-red-400',
    amber:   'bg-amber-500/10   border-amber-500/20   text-amber-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    slate:   'bg-white/5        border-white/10       text-slate-400',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
