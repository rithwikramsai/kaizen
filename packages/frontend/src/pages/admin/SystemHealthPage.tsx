import { useQuery } from '@tanstack/react-query'
import { fetchSystemHealth } from '../../api/admin.js'
import { PageTransition } from '../../components/PageTransition.js'

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
  )
}

function HealthCard({
  label,
  value,
  status,
  accent,
}: {
  label: string
  value: number | string
  status?: 'ok' | 'error'
  accent: string
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent}`}>
      <div className="flex items-center gap-2 mb-2">
        {status !== undefined && <StatusDot ok={status === 'ok'} />}
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

export function SystemHealthPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: fetchSystemHealth,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB')
    : null

  return (
    <PageTransition>
      <div className="max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">System Health</h1>
            <p className="text-sm text-slate-400">Auto-refreshes every 30 seconds</p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-600 mt-1">Last updated: {lastUpdated}</span>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-5 animate-pulse h-24" />
            ))}
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load health data.
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Infrastructure</h2>
              <div className="grid grid-cols-1 gap-4">
                <HealthCard
                  label="Database"
                  value={data.database === 'ok' ? 'Connected' : 'Error'}
                  status={data.database}
                  accent={data.database === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                  }
                />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Record Counts</h2>
              <div className="grid grid-cols-3 gap-4">
                <HealthCard label="Users"   value={data.totals.users}   accent="bg-indigo-500/10 border-indigo-500/20" />
                <HealthCard label="Ideas"   value={data.totals.ideas}   accent="bg-violet-500/10 border-violet-500/20" />
                <HealthCard label="Kaizens" value={data.totals.kaizens} accent="bg-violet-500/10 border-violet-500/20" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Queue Depth</h2>
              <div className="grid grid-cols-2 gap-4">
                <HealthCard
                  label="Pending Workflow Steps"
                  value={data.pending_workflows}
                  accent={data.pending_workflows > 50
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-sky-500/10 border-sky-500/20'
                  }
                />
                <HealthCard
                  label="Unread Notifications"
                  value={data.unread_notifications}
                  accent="bg-slate-500/10 border-slate-500/20"
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
