import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyRatings, submitScRating, type ScPendingItem } from '../../api/rewards.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

function RatingModal({
  item,
  onClose,
  onSuccess,
}: {
  item: ScPendingItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () => submitScRating(item.nomination_id, Number(score), notes || null),
    onSuccess,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-1">Rate Kaizen</h2>
        <p className="text-slate-400 text-sm mb-5">{item.title} · {item.registration_id}</p>

        {mutation.isError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Rating Score (1–10)</label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.5"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 7.5"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg transition-all">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !score}
            className="flex-1 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
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
  const completed = items.filter((i) => i.has_rated)

  return (
    <PageTransition>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">SC Rating Queue</h1>
          <p className="text-sm text-slate-400">High-impact kaizens assigned to you for rating</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-300 p-4">
            <p className="text-2xl font-bold">{pending.length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Pending</p>
          </div>
          <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-300 p-4">
            <p className="text-2xl font-bold">{completed.length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Rated</p>
          </div>
        </div>

        {isLoading ? (
          <SkeletonDetail />
        ) : isError ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load rating queue.</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 text-base font-medium mb-1">No ratings assigned</p>
            <p className="text-slate-500 text-sm">You will be notified when new high-impact kaizens are nominated.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  <th className="px-5 py-3 text-left">Reg. No</th>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Zone</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.rating_id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-slate-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-md">
                        {item.registration_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="text-white font-medium truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.owner_name ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 hidden sm:table-cell">{item.zone_name}</td>
                    <td className="px-5 py-3.5">
                      {item.has_rated ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Rated</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/rewards/nominations/${item.nomination_id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium rounded-lg transition-all"
                        >
                          View
                        </button>
                        {!item.has_rated && (
                          <button
                            onClick={() => setRatingItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium rounded-lg transition-all"
                          >
                            Rate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
      </div>
    </PageTransition>
  )
}
