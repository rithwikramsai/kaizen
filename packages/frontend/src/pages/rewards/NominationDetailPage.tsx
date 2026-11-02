import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNominationDetail, nominateSpecialRR, nominateInterPlant } from '../../api/rewards.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

const STATUS_COLORS: Record<string, string> = {
  PENDING_RATINGS: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  RATINGS_COMPLETE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  NOMINATED_SPECIAL: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  NOMINATED_INTER_PLANT: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  CLOSED: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_RATINGS: 'Pending Ratings',
  RATINGS_COMPLETE: 'Ratings Complete',
  NOMINATED_SPECIAL: 'Special R&R',
  NOMINATED_INTER_PLANT: 'Inter-Plant',
  CLOSED: 'Closed',
}

const ROUNDS = ['PLANT', 'CLUSTER', 'NATIONAL']

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export function NominationDetailPage() {
  const { nominationId } = useParams<{ nominationId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [showInterPlantModal, setShowInterPlantModal] = useState(false)
  const [specialAmount, setSpecialAmount] = useState('')
  const [specialDetails, setSpecialDetails] = useState('')
  const [ipYear, setIpYear] = useState(String(new Date().getFullYear()))
  const [ipRound, setIpRound] = useState('PLANT')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['nomination', nominationId],
    queryFn: () => getNominationDetail(nominationId!),
    staleTime: 30_000,
    enabled: !!nominationId,
  })

  const specialMutation = useMutation({
    mutationFn: () =>
      nominateSpecialRR(nominationId!, specialAmount ? Number(specialAmount) : null, specialDetails || null),
    onSuccess: () => {
      setShowSpecialModal(false)
      void queryClient.invalidateQueries({ queryKey: ['nomination', nominationId] })
      void queryClient.invalidateQueries({ queryKey: ['rewards-queue'] })
    },
  })

  const interPlantMutation = useMutation({
    mutationFn: () => nominateInterPlant(nominationId!, Number(ipYear), ipRound),
    onSuccess: () => {
      setShowInterPlantModal(false)
      void queryClient.invalidateQueries({ queryKey: ['nomination', nominationId] })
      void queryClient.invalidateQueries({ queryKey: ['rewards-queue'] })
    },
  })

  if (isLoading) return <PageTransition><SkeletonDetail /></PageTransition>
  if (isError || !data) {
    return (
      <PageTransition>
        <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load nomination.</div>
      </PageTransition>
    )
  }

  const allRated = data.sc_ratings.every((r) => r.has_rated)
  const avgScore = allRated && data.sc_ratings.length > 0
    ? (data.sc_ratings.reduce((sum, r) => sum + (r.rating_score ?? 0), 0) / data.sc_ratings.length).toFixed(1)
    : null

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <button
          onClick={() => navigate('/rewards')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-5 transition-colors"
        >
          <BackIcon /> Back to Rewards
        </button>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{data.title}</h1>
            <p className="text-sm text-slate-400">{data.registration_id} · Nominated by {data.nominated_by_name}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[data.nomination_status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
            {STATUS_LABELS[data.nomination_status] ?? data.nomination_status}
          </span>
        </div>

        {/* Summary */}
        <div className="glass rounded-2xl p-5 mb-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Owner</p>
            <p className="text-white text-sm font-medium">{data.owner_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">SC Members</p>
            <p className="text-white text-sm font-medium">{data.sc_ratings.length}</p>
          </div>
          {avgScore && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Avg Rating</p>
              <p className="text-emerald-300 text-sm font-bold">{avgScore} / 10</p>
            </div>
          )}
        </div>

        {/* SC Ratings table */}
        <div className="glass rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">SC Member Ratings</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                <th className="px-5 py-3 text-left">Member</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Score</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.sc_ratings.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3.5 text-white font-medium">{r.sc_member_name}</td>
                  <td className="px-5 py-3.5">
                    {r.has_rated ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Rated</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20">Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.rating_score != null ? (
                      <span className="text-white font-semibold">{r.rating_score}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 hidden sm:table-cell max-w-[200px] truncate">
                    {r.rating_notes ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        {data.nomination_status === 'RATINGS_COMPLETE' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowSpecialModal(true)}
              className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium rounded-xl transition-all"
            >
              Nominate Special R&R
            </button>
            <button
              onClick={() => setShowInterPlantModal(true)}
              className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-xl transition-all"
            >
              Nominate Inter-Plant
            </button>
          </div>
        )}
        {data.nomination_status === 'NOMINATED_SPECIAL' && (
          <button
            onClick={() => setShowInterPlantModal(true)}
            className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-xl transition-all"
          >
            Nominate Inter-Plant
          </button>
        )}

        {/* Special R&R modal */}
        {showSpecialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-white font-semibold text-lg mb-4">Nominate for Special R&R</h2>
              {specialMutation.isError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {(specialMutation.error as Error).message}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Reward Amount (optional)</label>
                  <input type="number" value={specialAmount} onChange={(e) => setSpecialAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Details (optional)</label>
                  <textarea value={specialDetails} onChange={(e) => setSpecialDetails(e.target.value)} rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSpecialModal(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg transition-all">Cancel</button>
                <button onClick={() => specialMutation.mutate()} disabled={specialMutation.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50">
                  {specialMutation.isPending ? 'Nominating…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inter-plant modal */}
        {showInterPlantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-white font-semibold text-lg mb-4">Nominate for Inter-Plant</h2>
              {interPlantMutation.isError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {(interPlantMutation.error as Error).message}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Competition Year</label>
                  <input type="number" value={ipYear} onChange={(e) => setIpYear(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Competition Round</label>
                  <select value={ipRound} onChange={(e) => setIpRound(e.target.value)}
                    className="w-full bg-[#0f0f23] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50">
                    {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowInterPlantModal(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg transition-all">Cancel</button>
                <button onClick={() => interPlantMutation.mutate()} disabled={interPlantMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50">
                  {interPlantMutation.isPending ? 'Nominating…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
