import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSlaConfigs, patchSlaConfig, createSlaConfig, type SlaConfig, type CreateSlaConfigInput } from '../../api/admin.js'
import { getPlants, type Plant } from '../../api/master.js'
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

function NewSlaConfigModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [plantId, setPlantId] = useState('')
  const [stageCode, setStageCode] = useState('')
  const [workflowType, setWorkflowType] = useState('')
  const [slaHours, setSlaHours] = useState('')
  const [reminderHrs, setReminderHrs] = useState('')

  const { data: plants } = useQuery({ queryKey: ['plants-for-sla'], queryFn: getPlants, staleTime: 300_000 })

  const mutation = useMutation({
    mutationFn: () => {
      const input: CreateSlaConfigInput = {
        plant_id: plantId,
        stage_code: stageCode.trim().toUpperCase(),
        workflow_type: workflowType.trim().toUpperCase(),
        sla_hours: parseInt(slaHours, 10),
        ...(reminderHrs.trim() ? { reminder_hrs: parseInt(reminderHrs, 10) } : {}),
      }
      return createSlaConfig(input)
    },
    onSuccess: () => { onSaved(); onClose() },
  })

  const isValid = plantId && stageCode.trim() && workflowType.trim() && parseInt(slaHours, 10) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-base mb-5">New SLA Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Plant *</label>
            <select
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Select plant…</option>
              {plants?.map((p: Plant) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Workflow Type *</label>
            <select
              value={workflowType}
              onChange={(e) => setWorkflowType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500/50"
            >
              <option value="">Select type…</option>
              <option value="IDEA_APPROVAL">IDEA_APPROVAL</option>
              <option value="IMPLEMENTATION_APPROVAL">IMPLEMENTATION_APPROVAL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Stage Code *</label>
            <input
              type="text"
              value={stageCode}
              onChange={(e) => setStageCode(e.target.value)}
              placeholder="e.g. HOD_REVIEW"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">SLA Hours *</label>
            <input
              type="number"
              min={1}
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Reminder Hours (optional)</label>
            <input
              type="number"
              min={1}
              value={reminderHrs}
              onChange={(e) => setReminderHrs(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        {mutation.isError && (
          <p className="text-red-400 text-xs mt-3">{(mutation.error as Error).message}</p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 text-sm rounded-lg hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!isValid || mutation.isPending}
            className="px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-lg hover:bg-indigo-600/30 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SLAConfigurationPage() {
  const queryClient = useQueryClient()
  const [showNewModal, setShowNewModal] = useState(false)

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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">SLA Configuration</h1>
            <p className="text-sm text-slate-400">Manage SLA hours per plant, workflow type, and stage</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg hover:bg-indigo-600/30 transition-all"
          >
            + New Config
          </button>
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
            <p className="text-slate-400 mb-4">No SLA configurations found</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-lg hover:bg-indigo-600/30 transition-all"
            >
              + Create first config
            </button>
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

      {showNewModal && (
        <NewSlaConfigModal onClose={() => setShowNewModal(false)} onSaved={invalidate} />
      )}
    </PageTransition>
  )
}
