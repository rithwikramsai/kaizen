import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNominationDetail,
  nominateSpecialRR,
  nominateInterPlant,
} from '../../api/rewards.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'
import { useAuth } from '../../hooks/useAuth.js'

const STATUS_COLORS: Record<string, string> = {
  PENDING_RATINGS:     'bg-amber-500/15 text-amber-300 border-amber-500/20',
  RATINGS_COMPLETE:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  NOMINATED_SPECIAL:   'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  NOMINATED_INTER_PLANT: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  CLOSED:              'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_RATINGS:     'Pending Ratings',
  RATINGS_COMPLETE:    'Ratings Complete',
  NOMINATED_SPECIAL:   'Special R&R',
  NOMINATED_INTER_PLANT: 'Inter-Plant',
  CLOSED:              'Closed',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function NominationDetailPage() {
  const { nominationId } = useParams<{ nominationId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()

  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [showInterPlantModal, setShowInterPlantModal] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nomination', nominationId],
    queryFn: () => getNominationDetail(nominationId!),
    enabled: !!nominationId,
    staleTime: 30_000,
  })

  const specialMutation = useMutation({
    mutationFn: ({ amount, details }: { amount: number | null; details: string | null }) =>
      nominateSpecialRR(nominationId!, amount, details),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['nomination', nominationId] })
      void queryClient.invalidateQueries({ queryKey: ['rewards-queue'] })
      setShowSpecialModal(false)
    },
  })

  const interPlantMutation = useMutation({
    mutationFn: ({ year, round }: { year: number; round: string }) =>
      nominateInterPlant(nominationId!, year, round),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['nomination', nominationId] })
      void queryClient.invalidateQueries({ queryKey: ['rewards-queue'] })
      setShowInterPlantModal(false)
    },
  })

  if (isLoading) return <PageTransition><SkeletonDetail /></PageTransition>
  if (isError || !data) return (
    <PageTransition>
      <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load nomination.</div>
    </PageTransition>
  )

  const canAct = hasPermission('CAN_NOMINATE_HIGH_IMPACT') && data.nomination_status === 'RATINGS_COMPLETE'
  const avgScore = data.sc_ratings.filter((r) => r.has_rated && r.rating_score != null).length > 0
    ? (data.sc_ratings.filter((r) => r.has_rated).reduce((sum, r) => sum + (r.rating_score ?? 0), 0) /
       data.sc_ratings.filter((r) => r.has_rated && r.rating_score != null).length).toFixed(1)
    : null

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <button
          onClick={() => navigate('/rewards')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-5 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Rewards
        </button>

        {/* Header */}
        <div className="glass rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {data.kaizen_ref && (
                  <span className="font-mono text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                    {data.kaizen_ref}
                  </span>
                )}
                <span className="font-mono text-[10px] bg-white/5 text-slate-400 border border-white/8 px-2 py-0.5 rounded-md">
                  {data.registration_id}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[data.nomination_status] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                  {STATUS_LABELS[data.nomination_status] ?? data.nomination_status}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white">{data.title}</h1>
              <p className="text-sm text-slate-400 mt-1">
                Impl. Owner: {data.owner_name ?? '—'} · Nominated by {data.nominated_by_name} on {fmtDate(data.nominated_at)}
              </p>
            </div>
            {avgScore && (
              <div className="flex-shrink-0 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-amber-300">{avgScore}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Avg Score</p>
              </div>
            )}
          </div>

          {canAct && (
            <div className="flex gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowSpecialModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/25 text-indigo-300 text-sm font-medium rounded-xl transition-all"
              >
                Nominate for Special R&amp;R
              </button>
              <button
                onClick={() => setShowInterPlantModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-sm font-medium rounded-xl transition-all"
              >
                Nominate for Inter-Plant
              </button>
            </div>
          )}
        </div>

        {/* SC Ratings */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">SC Member Ratings</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data.sc_ratings.filter((r) => r.has_rated).length} of {data.sc_ratings.length} rated
            </p>
          </div>
          {data.sc_ratings.map((r, idx) => (
            <div
              key={r.id}
              className={`flex items-center gap-4 px-5 py-3.5 ${idx < data.sc_ratings.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{r.sc_member_name}</p>
                {r.rating_notes && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{r.rating_notes}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                {r.has_rated ? (
                  <span className="text-lg font-bold text-amber-300">{r.rating_score?.toFixed(1)}</span>
                ) : (
                  <span className="text-[11px] text-slate-600 italic">Pending</span>
                )}
                {r.rated_at && (
                  <p className="text-[10px] text-slate-600 mt-0.5">{fmtDate(r.rated_at)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSpecialModal && (
        <SpecialRRModal
          onClose={() => setShowSpecialModal(false)}
          onSubmit={(amount, details) => specialMutation.mutate({ amount, details })}
          isPending={specialMutation.isPending}
          error={specialMutation.error as Error | null}
        />
      )}

      {showInterPlantModal && (
        <InterPlantModal
          onClose={() => setShowInterPlantModal(false)}
          onSubmit={(year, round) => interPlantMutation.mutate({ year, round })}
          isPending={interPlantMutation.isPending}
          error={interPlantMutation.error as Error | null}
        />
      )}
    </PageTransition>
  )
}

function SpecialRRModal({
  onClose, onSubmit, isPending, error,
}: { onClose: () => void; onSubmit: (a: number | null, d: string | null) => void; isPending: boolean; error: Error | null }) {
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-4">Nominate for Special R&amp;R</h2>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error.message}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Reward Amount (optional)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Details (optional)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={() => onSubmit(amount ? Number(amount) : null, details || null)} disabled={isPending}
            className="flex-1 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg hover:bg-indigo-600/30 transition-all disabled:opacity-50">
            {isPending ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InterPlantModal({
  onClose, onSubmit, isPending, error,
}: { onClose: () => void; onSubmit: (y: number, r: string) => void; isPending: boolean; error: Error | null }) {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [round, setRound] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-4">Nominate for Inter-Plant Competition</h2>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error.message}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Competition Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Competition Round</label>
            <input type="text" value={round} onChange={(e) => setRound(e.target.value)} placeholder="e.g. Q1, Round 1"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={() => onSubmit(Number(year), round)} disabled={isPending || !round || !year}
            className="flex-1 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-lg hover:bg-purple-600/30 transition-all disabled:opacity-50">
            {isPending ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
