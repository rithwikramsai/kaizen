import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchWorkflowTemplates, fetchWorkflowTemplateById, type WorkflowTemplate } from '../../api/admin.js'
import { PageTransition } from '../../components/PageTransition.js'

function TemplateSidebar({
  template,
  onClose,
}: {
  template: WorkflowTemplate
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-workflow-template', template.id],
    queryFn: () => fetchWorkflowTemplateById(template.id),
    staleTime: 300_000,
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#1a1a2e] border-l border-white/10 flex flex-col h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-white font-semibold text-base">{template.name}</h2>
            <span className="inline-flex mt-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[11px] text-indigo-300 font-medium">
              {template.workflow_type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex-1">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {data && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">
                Steps ({data.steps.length})
              </p>
              {data.steps.map((step) => (
                <div key={step.id} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                      {step.step_order}
                    </span>
                    <span className="text-white text-sm font-medium">{step.stage_code}</span>
                    {step.is_dynamic && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded font-medium">
                        Dynamic
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 ml-9">
                    <span>Role: <span className="text-slate-400">{step.assigned_role}</span></span>
                    {step.sla_hours !== null && (
                      <span>SLA: <span className="text-slate-400">{step.sla_hours}h</span></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function WorkflowTemplatesPage() {
  const [selected, setSelected] = useState<WorkflowTemplate | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-workflow-templates'],
    queryFn: fetchWorkflowTemplates,
    staleTime: 300_000,
  })

  return (
    <PageTransition>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Workflow Templates</h1>
          <p className="text-sm text-slate-400">View configured approval workflow templates (read-only)</p>
        </div>

        {isLoading && (
          <div className="glass rounded-2xl overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 animate-pulse">
                <div className="h-4 w-40 bg-white/5 rounded" />
                <div className="h-4 w-24 bg-white/5 rounded ml-auto" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load templates.
          </div>
        )}

        {data && data.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400">No workflow templates found</p>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden">
            {data.map((t, idx) => (
              <div
                key={t.id}
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/3 transition-all ${
                  idx < data.length - 1 ? 'border-b border-white/5' : ''
                }`}
                onClick={() => setSelected(t)}
              >
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.workflow_type}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    t.is_active
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
                      : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                  }`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-slate-600">View steps →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <TemplateSidebar template={selected} onClose={() => setSelected(null)} />
      )}
    </PageTransition>
  )
}
