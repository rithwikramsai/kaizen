import { useQuery } from '@tanstack/react-query'
import { getRewardHistory, type RewardHistoryItem } from '../../api/rewards.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TypeBadge({ item }: { item: RewardHistoryItem }) {
  if (item.type === 'INTER_PLANT') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">
        Inter-Plant · {item.competition_round}
      </span>
    )
  }
  if (item.reward_type === 'SPECIAL') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
        Special R&R
      </span>
    )
  }
  if (item.nomination_status) {
    const labelMap: Record<string, string> = {
      PENDING_RATINGS: 'Pending Ratings',
      RATINGS_COMPLETE: 'Ratings Complete',
      NOMINATED_SPECIAL: 'Nominated Special',
      NOMINATED_INTER_PLANT: 'Inter-Plant',
      CLOSED: 'Closed',
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">
        High Impact · {labelMap[item.nomination_status] ?? item.nomination_status}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
      Regular
    </span>
  )
}

export function RewardHistoryPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reward-history'],
    queryFn: getRewardHistory,
    staleTime: 60_000,
  })

  const items = data ?? []

  return (
    <PageTransition>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Reward History</h1>
          <p className="text-sm text-slate-400">All rewards, high-impact nominations, and inter-plant nominations</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border bg-white/5 border-white/10 text-slate-300 p-4">
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Total Events</p>
          </div>
          <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-300 p-4">
            <p className="text-2xl font-bold">{items.filter((i) => i.reward_type === 'REGULAR').length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Regular</p>
          </div>
          <div className="rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-300 p-4">
            <p className="text-2xl font-bold">{items.filter((i) => i.reward_type === 'SPECIAL').length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Special</p>
          </div>
          <div className="rounded-xl border bg-purple-500/10 border-purple-500/20 text-purple-300 p-4">
            <p className="text-2xl font-bold">{items.filter((i) => i.type === 'INTER_PLANT').length}</p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Inter-Plant</p>
          </div>
        </div>

        {isLoading ? (
          <SkeletonDetail />
        ) : isError ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load reward history.</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 text-base font-medium mb-1">No history yet</p>
            <p className="text-slate-500 text-sm">Assigned rewards and nominations will appear here.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  <th className="px-5 py-3 text-left">Reg. No</th>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Owner</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">Zone</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-slate-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-md">
                        {item.registration_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <p className="text-white font-medium truncate">{item.title}</p>
                      {item.kaizen_ref && (
                        <p className="font-mono text-[11px] text-indigo-400">{item.kaizen_ref}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 hidden sm:table-cell">{item.owner_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-400 hidden md:table-cell">{item.zone_name}</td>
                    <td className="px-5 py-3.5"><TypeBadge item={item} /></td>
                    <td className="px-5 py-3.5 text-slate-400 hidden sm:table-cell text-[12px]">{formatDate(item.assigned_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
