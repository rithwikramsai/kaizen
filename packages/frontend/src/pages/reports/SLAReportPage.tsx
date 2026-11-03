import { useQuery } from '@tanstack/react-query'
import { getSLAReport, type OverdueStep } from '../../api/analytics.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function SlaKpiCard({
  label, value, unit, accent,
}: { label: string; value: string | number; unit?: string; accent?: 'success' | 'warning' | 'danger' | 'default' }) {
  const colors = {
    success: { border: 'border-emerald-500/20', value: 'text-emerald-300', dot: 'bg-emerald-400' },
    warning: { border: 'border-amber-500/20',   value: 'text-amber-300',   dot: 'bg-amber-400' },
    danger:  { border: 'border-red-500/20',      value: 'text-red-400',     dot: 'bg-red-400' },
    default: { border: 'border-white/8',         value: 'text-white',       dot: 'bg-slate-400' },
  }
  const cls = colors[accent ?? 'default']

  return (
    <div className={`bg-white/3 border ${cls.border} rounded-2xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${cls.dot}`} />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-3xl font-bold tabular-nums ${cls.value}`}>{value}</span>
        {unit && <span className="text-sm text-slate-500 mb-0.5">{unit}</span>}
      </div>
    </div>
  )
}

// ─── Overdue table ────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

function OverdueTable({ steps }: { steps: OverdueStep[] }) {
  if (steps.length === 0) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 text-center text-sm text-emerald-400">
        No overdue steps — all steps are within SLA.
      </div>
    )
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5">
        <span className="text-sm font-semibold text-slate-300">Overdue Steps ({steps.length})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left font-medium">Ref</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Stage</th>
              <th className="px-4 py-3 text-left font-medium">Assigned To</th>
              <th className="px-4 py-3 text-right font-medium">Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {steps.map((s) => (
              <tr key={s.step_id} className="hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                  {s.registration_id ?? s.entity_id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">
                  {s.title ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                    {s.stage_code}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{s.assigned_user_name ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-red-400 text-xs font-semibold">{timeAgo(s.sla_due_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SLAReportPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sla-report'],
    queryFn: getSLAReport,
    staleTime: 60_000,
  })

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">SLA Report</h1>
          <p className="text-sm text-slate-400 mt-1">Workflow step compliance and overdue tracking</p>
        </div>

        {isLoading && <SkeletonDetail />}

        {isError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-sm text-red-400">
            Failed to load SLA data.
          </div>
        )}

        {data && (
          <div className="flex flex-col gap-6">

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SlaKpiCard
                label="Avg Step Time"
                value={data.avg_step_time_hours != null ? Number(data.avg_step_time_hours).toFixed(1) : '—'}
                unit="hrs"
                accent="default"
              />
              <SlaKpiCard
                label="Overdue Steps"
                value={data.overdue_count}
                accent={data.overdue_count > 0 ? 'danger' : 'success'}
              />
              <SlaKpiCard
                label="Pending w/ SLA"
                value={data.total_pending_with_sla}
                accent="warning"
              />
              <SlaKpiCard
                label="Compliance"
                value={`${data.compliance_pct}%`}
                accent={data.compliance_pct >= 80 ? 'success' : data.compliance_pct >= 50 ? 'warning' : 'danger'}
              />
            </div>

            {/* Overdue steps table */}
            <OverdueTable steps={data.overdue_steps} />

          </div>
        )}

      </div>
    </PageTransition>
  )
}
