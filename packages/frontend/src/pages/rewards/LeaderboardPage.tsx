import { useQuery } from '@tanstack/react-query'
import { getLeaderboard, type LeaderboardEntry } from '../../api/rewards.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="text-sm text-slate-500 font-mono w-6 text-center">{rank}</span>
}

function StatPill({ value, color }: { value: number; color: string }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-[11px] font-semibold border ${color}`}>
      {value}
    </span>
  )
}

export function LeaderboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    staleTime: 60_000,
  })

  const entries = data ?? []

  return (
    <PageTransition>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
          <p className="text-sm text-slate-400">Top contributors ranked by rewards and nominations</p>
        </div>

        {isLoading ? (
          <SkeletonDetail />
        ) : isError ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load leaderboard.</div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 text-base font-medium mb-1">No data yet</p>
            <p className="text-slate-500 text-sm">The leaderboard will populate as kaizens are rewarded and nominated.</p>
          </div>
        ) : (
          <>
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {entries.slice(0, 3).map((entry, idx) => (
                  <div
                    key={entry.implementation_owner}
                    className={`glass rounded-2xl p-5 text-center ${idx === 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
                  >
                    <div className="flex justify-center mb-2">
                      <MedalIcon rank={idx + 1} />
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{entry.owner_name ?? 'Unknown'}</p>
                    <p className="text-[11px] text-slate-500 mb-3">{entry.zone_name}</p>
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      <StatPill value={entry.total_rewards} color="bg-emerald-500/10 border-emerald-500/20 text-emerald-300" />
                      <StatPill value={entry.total_kaizens} color="bg-indigo-500/10 border-indigo-500/20 text-indigo-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    <th className="px-5 py-3 text-left w-10">Rank</th>
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left hidden sm:table-cell">Zone</th>
                    <th className="px-5 py-3 text-center">Kaizens</th>
                    <th className="px-5 py-3 text-center">Rewards</th>
                    <th className="px-5 py-3 text-center hidden md:table-cell">High Impact</th>
                    <th className="px-5 py-3 text-center hidden md:table-cell">Inter-Plant</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: LeaderboardEntry, idx: number) => (
                    <tr
                      key={entry.implementation_owner}
                      className={`border-b border-white/5 last:border-0 transition-colors ${idx < 3 ? 'hover:bg-amber-500/3' : 'hover:bg-white/3'}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center">
                          <MedalIcon rank={idx + 1} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-white font-medium">{entry.owner_name ?? 'Unknown'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 hidden sm:table-cell">{entry.zone_name}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-indigo-300 font-semibold">{entry.total_kaizens}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-emerald-300 font-semibold">{entry.total_rewards}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="text-amber-300 font-semibold">{entry.high_impact_nominations}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="text-purple-300 font-semibold">{entry.inter_plant_nominations}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
