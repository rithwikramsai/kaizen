import { useQuery } from '@tanstack/react-query'
import { getIdeaTimeline, type TimelineEntry } from '../api/ideas.js'

const STAGE_LABELS: Record<string, string> = {
  ZONE_LEADER_REVIEW: 'Zone Leader Review',
  HOD_REVIEW:         'HOD Review',
  SAFETY_REVIEW:      'Safety Review',
  QUALITY_REVIEW:     'Quality Review',
  SME_REVIEW:         'SME Review',
  SCI_TECH_UPLOAD:    'Sci-Tech Upload',
  IDEA_APPROVED:      'Idea Approved',
  IDEA_REJECTED:      'Idea Rejected',
  KAIZEN_APPROVED:    'Kaizen Approved',
  KAIZEN_REJECTED:    'Kaizen Rejected',
}

interface StageCfg { cls: string; dot: string; icon: string }

const STATUS_CFG: Record<string, StageCfg> = {
  APPROVED: { cls: 'text-emerald-400', dot: 'bg-emerald-500 shadow-emerald-500/50', icon: '✓' },
  PENDING:  { cls: 'text-amber-400',   dot: 'bg-amber-500 shadow-amber-500/50',     icon: '·' },
  RETURNED: { cls: 'text-orange-400',  dot: 'bg-orange-500 shadow-orange-500/50',   icon: '↩' },
  REJECTED: { cls: 'text-red-400',     dot: 'bg-red-500 shadow-red-500/50',         icon: '✕' },
  SKIPPED:  { cls: 'text-slate-500',   dot: 'bg-slate-600',                         icon: '—' },
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface Props { ideaId: string }

export function WorkflowTimeline({ ideaId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['idea-timeline', ideaId],
    queryFn: () => getIdeaTimeline(ideaId),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 bg-white/10 rounded-full w-2/3" />
              <div className="h-2.5 bg-white/10 rounded-full w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) return <p className="text-xs text-red-400">Failed to load timeline.</p>

  const entries: TimelineEntry[] = data?.data ?? []
  if (entries.length === 0) return <p className="text-xs text-slate-500">No workflow steps yet.</p>

  return (
    <div>
      {entries.map((entry, i) => {
        const sc = STATUS_CFG[entry.status] ?? { cls: 'text-slate-400', dot: 'bg-slate-500', icon: '·' }
        const isLast = i === entries.length - 1
        return (
          <div key={i} className="flex gap-3">
            {/* Dot + connector line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-5 h-5 rounded-full ${sc.dot} flex items-center justify-center text-[10px] text-white font-bold mt-0.5 shadow-md flex-shrink-0`}
              >
                {sc.icon}
              </div>
              {!isLast && <div className="w-px flex-1 bg-white/10 my-1 min-h-[12px]" />}
            </div>

            {/* Content */}
            <div className={`${isLast ? 'pb-0' : 'pb-4'} flex-1`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-white">
                  {STAGE_LABELS[entry.stage] ?? entry.stage}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${sc.cls}`}>
                  {entry.status}
                </span>
              </div>

              {entry.actor && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {entry.actor.full_name}
                  {entry.action_taken_at && ` · ${fmt(entry.action_taken_at)}`}
                </p>
              )}

              {!entry.action_taken_at && entry.sla_due_at && (
                <p className="text-[11px] text-amber-500/70 mt-0.5">
                  SLA due: {fmt(entry.sla_due_at)}
                </p>
              )}

              {entry.comment && (
                <p className="text-xs text-slate-400 mt-2 italic bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                  "{entry.comment}"
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
