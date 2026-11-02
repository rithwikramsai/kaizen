import { useQuery } from '@tanstack/react-query'
import { getDashboardData, type DashboardData } from '../../api/reports.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: number
  accent?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
}

const ACCENT_CLASSES: Record<NonNullable<KpiCardProps['accent']>, { border: string; value: string; dot: string }> = {
  default: { border: 'border-white/8',          value: 'text-white',         dot: 'bg-slate-400' },
  success: { border: 'border-emerald-500/20',    value: 'text-emerald-300',   dot: 'bg-emerald-400' },
  warning: { border: 'border-amber-500/20',      value: 'text-amber-300',     dot: 'bg-amber-400' },
  danger:  { border: 'border-red-500/20',        value: 'text-red-400',       dot: 'bg-red-400' },
  info:    { border: 'border-sky-500/20',        value: 'text-sky-300',       dot: 'bg-sky-400' },
  purple:  { border: 'border-purple-500/20',     value: 'text-purple-300',    dot: 'bg-purple-400' },
}

function KpiCard({ label, value, accent = 'default' }: KpiCardProps) {
  const cls = ACCENT_CLASSES[accent]
  return (
    <div className={`bg-white/3 border ${cls.border} rounded-2xl p-5 flex flex-col gap-2 min-w-0`}>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${cls.dot} flex-shrink-0`} />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide truncate">{label}</span>
      </div>
      <span className={`text-3xl font-bold tabular-nums ${cls.value}`}>{value}</span>
    </div>
  )
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {children}
      </div>
    </div>
  )
}

// ─── Empty / Error state ──────────────────────────────────────────────────────

function EmptyDashboard() {
  const zero: DashboardData = {
    ideas:   { total: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 },
    kaizens: { in_progress: 0, submitted: 0, approved: 0 },
    rewards: { regular: 0, special: 0, high_impact: 0 },
    sla:     { overdue: 0, due_today: 0, within_sla: 0 },
  }
  return <DashboardBody data={zero} />
}

// ─── Dashboard body ───────────────────────────────────────────────────────────

function DashboardBody({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-8">

      <Section title="Ideas">
        <KpiCard label="Total"       value={data.ideas.total}        accent="default" />
        <KpiCard label="Submitted"   value={data.ideas.submitted}    accent="info" />
        <KpiCard label="Under Review" value={data.ideas.under_review} accent="warning" />
        <KpiCard label="Approved"    value={data.ideas.approved}     accent="success" />
        <KpiCard label="Rejected"    value={data.ideas.rejected}     accent="danger" />
      </Section>

      <Section title="Kaizens">
        <KpiCard label="In Progress" value={data.kaizens.in_progress} accent="info" />
        <KpiCard label="Submitted"   value={data.kaizens.submitted}   accent="warning" />
        <KpiCard label="Approved"    value={data.kaizens.approved}    accent="success" />
      </Section>

      <Section title="Rewards">
        <KpiCard label="Regular"     value={data.rewards.regular}     accent="default" />
        <KpiCard label="Special"     value={data.rewards.special}     accent="purple" />
        <KpiCard label="High Impact" value={data.rewards.high_impact} accent="warning" />
      </Section>

      <Section title="SLA Compliance">
        <KpiCard label="Overdue"    value={data.sla.overdue}    accent="danger" />
        <KpiCard label="Due Today"  value={data.sla.due_today}  accent="warning" />
        <KpiCard label="Within SLA" value={data.sla.within_sla} accent="success" />
      </Section>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: getDashboardData,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Plant KPI overview — ideas, kaizens, rewards, SLA</p>
        </div>

        {isLoading && <SkeletonDetail />}

        {isError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-sm text-red-400">
            Failed to load dashboard data. Please try again.
          </div>
        )}

        {!isLoading && !isError && data && <DashboardBody data={data} />}

        {!isLoading && !isError && !data && <EmptyDashboard />}

      </div>
    </PageTransition>
  )
}
