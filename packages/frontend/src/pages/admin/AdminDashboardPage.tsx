import { useQuery } from '@tanstack/react-query'
import { fetchAdminDashboard } from '../../api/admin.js'
import { PageTransition } from '../../components/PageTransition.js'

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: number | string
  sub?: string
  accent: string
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent}`}>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
    staleTime: 60_000,
  })

  return (
    <PageTransition>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Platform-wide KPIs</p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-5 animate-pulse h-24" />
            ))}
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load dashboard data.
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Users</h2>
              <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Users"    value={data.users.total}    accent="bg-indigo-500/10 border-indigo-500/20" />
                <KpiCard label="Active"         value={data.users.active}   accent="bg-emerald-500/10 border-emerald-500/20" />
                <KpiCard label="Inactive"       value={data.users.inactive} accent="bg-slate-500/10 border-slate-500/20" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Organisation</h2>
              <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Plants"      value={data.org.plants}      accent="bg-violet-500/10 border-violet-500/20" />
                <KpiCard label="Zones"       value={data.org.zones}       accent="bg-violet-500/10 border-violet-500/20" />
                <KpiCard label="Departments" value={data.org.departments} accent="bg-violet-500/10 border-violet-500/20" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Workflows</h2>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard label="Active Workflows" value={data.workflows.active}  accent="bg-sky-500/10 border-sky-500/20" />
                <KpiCard label="Overdue Steps"    value={data.workflows.overdue} accent="bg-red-500/10 border-red-500/20" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Platform</h2>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard label="Total Notifications" value={data.notifications.total} accent="bg-amber-500/10 border-amber-500/20" />
                <KpiCard label="Total Rewards"       value={data.rewards.total}       accent="bg-amber-500/10 border-amber-500/20" />
              </div>
            </section>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
