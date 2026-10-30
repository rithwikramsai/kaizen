import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovedQueue, markImplemented } from '../../api/kaizens.js'
import { useToast } from '../../hooks/useToast.js'
import { PageTransition } from '../../components/PageTransition.js'

const KAIZEN_STATUS: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS:          { label: 'Documentation Pending', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  ONE_PAGER_SUBMITTED:  { label: 'Under Review',          cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  APPROVED:             { label: 'Approved',               cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  REJECTED:             { label: 'Rejected',               cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
}

function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
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

export function ApprovedQueuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data: ideas = [], isLoading, isError } = useQuery({
    queryKey: ['approved-queue'],
    queryFn: getApprovedQueue,
  })

  const markMutation = useMutation({
    mutationFn: (ideaId: string) => markImplemented(ideaId),
    onSuccess: (result, _ideaId) => {
      void queryClient.invalidateQueries({ queryKey: ['approved-queue'] })
      addToast(`Kaizen ${result.kaizen_id} created`, 'success')
      navigate(`/kaizens/${result.kaizen_uuid}`)
    },
    onError: (err: Error) => addToast(err.message, 'error'),
  })

  return (
    <PageTransition>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Implementation Queue</h1>
          <p className="text-sm text-slate-400 mt-1">Approved ideas awaiting implementation and One Pager documentation.</p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">
            Failed to load queue. Please try again.
          </div>
        )}

        {!isLoading && !isError && ideas.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm">No approved ideas in the queue yet.</p>
          </div>
        )}

        {!isLoading && !isError && ideas.length > 0 && (
          <div className="space-y-3">
            {ideas.map((idea) => {
              const kz = idea.kaizen
              const statusCfg = kz ? (KAIZEN_STATUS[kz.status] ?? KAIZEN_STATUS['IN_PROGRESS']!) : null
              const canMark = !kz
              const canOpen = !!kz

              return (
                <div key={idea.id} className="glass rounded-2xl p-5 flex items-start gap-4 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-slate-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-md">
                        {idea.registration_id}
                      </span>
                      {kz?.kaizen_id && (
                        <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                          {kz.kaizen_id}
                        </span>
                      )}
                      {statusCfg && (
                        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white truncate">{idea.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-500">{idea.submitted_by.full_name}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-500">{idea.zone.name}</span>
                      {idea.department && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500">{idea.department.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canMark && (
                      <button
                        onClick={() => markMutation.mutate(idea.id)}
                        disabled={markMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-medium rounded-xl transition-all disabled:opacity-50"
                      >
                        <WrenchIcon />
                        Mark Implemented
                      </button>
                    )}
                    {canOpen && (
                      <button
                        onClick={() => navigate(`/kaizens/${kz!.id}`)}
                        className="flex items-center gap-2 px-4 py-2 glass hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all border border-white/5"
                      >
                        Open One Pager
                        <ArrowIcon />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
