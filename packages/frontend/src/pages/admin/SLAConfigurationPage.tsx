import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSlaConfigs, patchSlaConfig, type SlaConfig } from '../../api/admin.js'
import { PageTransition } from '../../components/PageTransition.js'

function EditableHours({
  config,
  onSaved,
}: {
  config: SlaConfig
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(config.sla_hours))

  const mutation = useMutation({
    mutationFn: (hours: number) => patchSlaConfig(config.id, hours),
    onSuccess: () => {
      setEditing(false)
      onSaved()
    },
  })

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white font-medium">{config.sla_hours}h</span>
        <button
          onClick={() => { setValue(String(config.sla_hours)); setEditing(true) }}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 bg-white/5 border border-indigo-500/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
        autoFocus
      />
      <button
        onClick={() => {
          const n = parseInt(value, 10)
          if (!Number.isNaN(n) && n > 0) mutation.mutate(n)
        }}
        disabled={mutation.isPending}
        className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs rounded-lg hover:bg-indigo-500/30 transition-all disabled:opacity-50"
      >
        {mutation.isPending ? '…' : 'Save'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="px-2 py-1 bg-white/5 border border-white/10 text-slate-400 text-xs rounded-lg hover:bg-white/10 transition-all"
      >
        Cancel
      </button>
      {mutation.isError && (
        <span className="text-red-400 text-xs">{(mutation.error as Error).message}</span>
      )}
    </div>
  )
}

export function SLAConfigurationPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-sla-configs'],
    queryFn: () => fetchSlaConfigs(),
    staleTime: 60_000,
  })

  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ['admin-sla-configs'] }) }

  const grouped = data?.reduce<Record<string, SlaConfig[]>>((acc, c) => {
    const key = c.plant_name ?? c.plant_id
    if (!acc[key]) acc[key] = []
    acc[key]!.push(c)
    return acc
  }, {}) ?? {}

  return (
    <PageTransition>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">SLA Configuration</h1>
          <p className="text-sm text-slate-400">Manage SLA hours per plant, workflow type, and stage</p>
        </div>

        {isLoading && (
          <div className="glass rounded-2xl p-8">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load SLA configs.
          </div>
        )}

        {data && Object.keys(grouped).length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400">No SLA configurations found</p>
          </div>
        )}

        {data && Object.keys(grouped).length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([plantName, configs]) => (
              <section key={plantName}>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{plantName}</h2>
                <div className="glass rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Workflow Type</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Stage</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Reminder (hrs)</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">SLA Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((c, idx) => (
                        <tr key={c.id} className={idx < configs.length - 1 ? 'border-b border-white/5' : ''}>
                          <td className="px-5 py-3">
                            <span className="inline-flex px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium rounded">
                              {c.workflow_type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-300 font-mono text-xs">{c.stage_code}</td>
                          <td className="px-5 py-3 text-slate-400">{c.reminder_hrs !== null ? `${c.reminder_hrs}h` : '—'}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              c.is_active
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
                                : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                            }`}>
                              {c.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <EditableHours config={c} onSaved={invalidate} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
