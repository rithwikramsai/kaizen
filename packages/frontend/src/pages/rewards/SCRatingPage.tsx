import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyRatings, submitScRating, type ScPendingItem } from '../../api/rewards.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function RatingModal({
  item,
  onClose,
  onSuccess,
}: {
  item: ScPendingItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [score, setScore] = useState(5)
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () => submitScRating(item.nomination_id, score, notes || null),
    onSuccess,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-1">Submit SC Rating</h2>
        <p className="text-slate-400 text-sm mb-5 truncate">{item.title} · {item.registration_id}</p>

        {mutation.isError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400">Rating Score</label>
              <span className="text-2xl font-bold text-amber-300">{score}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>1 (Low)</span>
              <span>10 (High)</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Justification for your rating…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-slate-300 text-sm rounded-lg hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium rounded-lg hover:bg-amber-500/30 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SCRatingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [ratingItem, setRatingItem] = useState<ScPendingItem | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-ratings'],
    queryFn: getMyRatings,
    staleTime: 30_000,
  })

  const items = data ?? []
  const pending = items.filter((i) => !i.has_rated)
  const done = items.filter((i) => i.has_rated)

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">SC Ratings</h1>
          <p className="text-sm text-slate-400">Rate high-impact kaizens nominated for special recognition</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-300 p-4">
            <p className="text-2xl font-bold">{pending.length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Pending Rating</p>
          </div>
          <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-300 p-4">
            <p className="text-2xl font-bold">{done.length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Rated</p>
          </div>
        </div>

        {isLoading ? (
          <SkeletonDetail />
        ) : isError ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load ratings.</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 text-base font-medium mb-1">No nominations to rate</p>
            <p className="text-slate-500 text-sm">High-impact nominations assigned to you will appear here.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Pending Your Rating</h2>
                <div className="glass rounded-2xl overflow-hidden">
                  {pending.map((item, idx) => (
                    <div
                      key={item.rating_id}
                      className={`flex items-center gap-4 px-5 py-4 ${idx < pending.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[10px] bg-white/5 text-slate-400 border border-white/8 px-1.5 py-0.5 rounded-md">{item.registration_id}</span>
                        </div>
                        <p className="text-white font-medium text-sm truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.owner_name ?? 'Unknown'} · {item.zone_name} · Nominated {fmtDate(item.nominated_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/rewards/nominations/${item.nomination_id}`)}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 text-xs font-medium rounded-lg hover:bg-white/10 transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setRatingItem(item)}
                          className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-medium rounded-lg hover:bg-amber-500/25 transition-all"
                        >
                          Rate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {done.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Rated</h2>
                <div className="glass rounded-2xl overflow-hidden">
                  {done.map((item, idx) => (
                    <div
                      key={item.rating_id}
                      className={`flex items-center gap-4 px-5 py-4 ${idx < done.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 font-medium text-sm truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{item.zone_name}</p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                        Rated
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {ratingItem && (
        <RatingModal
          item={ratingItem}
          onClose={() => setRatingItem(null)}
          onSuccess={() => {
            setRatingItem(null)
            void queryClient.invalidateQueries({ queryKey: ['my-ratings'] })
          }}
        />
      )}
    </PageTransition>
  )
}
