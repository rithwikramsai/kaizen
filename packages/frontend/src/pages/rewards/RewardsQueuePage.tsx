import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getRewardsQueue,
  assignRegularReward,
  nominateHighImpact,
  type ApprovedKaizenForRR,
} from '../../api/rewards.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'
import { useAuth } from '../../hooks/useAuth.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtScore(score: number | null | undefined) {
  if (score == null) return '—'
  return score.toFixed(1)
}

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = 'approved' | 'rejected' | 'kaizens_rr' | 'high_impact' | 'high_impact_rr'

const TABS: { id: TabId; label: string }[] = [
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'kaizens_rr', label: 'Kaizens R&R' },
  { id: 'high_impact', label: 'High Impact Kaizens' },
  { id: 'high_impact_rr', label: 'High Impact Kaizen R&R' },
]

function filterByTab(items: ApprovedKaizenForRR[], tab: TabId): ApprovedKaizenForRR[] {
  switch (tab) {
    case 'approved':   return items
    case 'rejected':   return []
    case 'kaizens_rr': return items.filter((i) => i.reward != null)
    case 'high_impact':
      return items.filter(
        (i) => i.nomination != null &&
          (i.nomination.nomination_status === 'PENDING_RATINGS' || i.nomination.nomination_status === 'RATINGS_COMPLETE'),
      )
    case 'high_impact_rr':
      return items.filter(
        (i) => i.nomination != null &&
          (i.nomination.nomination_status === 'NOMINATED_SPECIAL' ||
           i.nomination.nomination_status === 'NOMINATED_INTER_PLANT' ||
           i.nomination.nomination_status === 'CLOSED'),
      )
    default: return items
  }
}

// ─── Status chip ──────────────────────────────────────────────────────────────

function StatusChip({ item }: { item: ApprovedKaizenForRR }) {
  if (item.nomination) {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING_RATINGS:     { label: 'Pending Ratings', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
      RATINGS_COMPLETE:    { label: 'Ratings Complete', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
      NOMINATED_SPECIAL:   { label: 'Special R&R', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20' },
      NOMINATED_INTER_PLANT: { label: 'Inter-Plant', cls: 'bg-purple-500/15 text-purple-300 border-purple-500/20' },
      CLOSED:              { label: 'Closed', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
    }
    const s = map[item.nomination.nomination_status] ?? { label: item.nomination.nomination_status, cls: 'bg-white/10 text-slate-300 border-white/10' }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${s.cls}`}>
        High Impact · {s.label}
      </span>
    )
  }
  if (item.reward) {
    if (item.reward.reward_type === 'SPECIAL') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-indigo-500/15 text-indigo-300 border-indigo-500/20">Special R&amp;R</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/15 text-emerald-300 border-emerald-500/20">Kaizen R&amp;R</span>
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-500/15 text-slate-400 border-slate-500/20">Approved</span>
}

// ─── Gear action menu ─────────────────────────────────────────────────────────

function GearMenu({
  item, canAssign, onAssign, onNominate, isNominating, onViewNomination,
}: {
  item: ApprovedKaizenForRR; canAssign: boolean; onAssign: () => void
  onNominate: () => void; isNominating: boolean; onViewNomination?: () => void
}) {
  const [open, setOpen] = useState(false)
  const hasActions = canAssign || !!item.nomination
  if (!hasActions) return null

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Actions">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {canAssign && !item.reward && !item.nomination && (
              <>
                <button onClick={() => { setOpen(false); onAssign() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-300 hover:bg-amber-500/10 transition-colors">
                  Assign Regular R&amp;R
                </button>
                <button onClick={() => { setOpen(false); onNominate() }} disabled={isNominating}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-300 hover:bg-indigo-500/10 transition-colors disabled:opacity-50">
                  {isNominating ? 'Nominating…' : 'Select as High Impact'}
                </button>
              </>
            )}
            {item.nomination && onViewNomination && (
              <button onClick={() => { setOpen(false); onViewNomination() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                View Nomination
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Kaizen card ──────────────────────────────────────────────────────────────

function KaizenCard({ item, canAssign, onAssign, onNominate, isNominating, onViewNomination, onViewIdea }: {
  item: ApprovedKaizenForRR; canAssign: boolean; onAssign: () => void
  onNominate: () => void; isNominating: boolean; onViewNomination?: () => void; onViewIdea?: () => void
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-white/10 transition-colors">
      <div className="flex items-start gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {item.kaizen_ref && (
            <span className="font-mono text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md">{item.kaizen_ref}</span>
          )}
          <button
            onClick={onViewIdea}
            className="font-mono text-[10px] bg-white/5 text-slate-400 border border-white/8 px-2 py-0.5 rounded-md hover:bg-white/10 hover:text-indigo-300 transition-colors cursor-pointer"
            title="View idea details"
          >{item.registration_id}</button>
          <StatusChip item={item} />
        </div>
        <GearMenu item={item} canAssign={canAssign} onAssign={onAssign} onNominate={onNominate} isNominating={isNominating} onViewNomination={onViewNomination} />
      </div>

      <p className="text-white font-semibold text-sm leading-snug">{item.title}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
        <MetaField label="Category" value={item.category_name ?? '—'} />
        <MetaField label="Department" value={item.department_name ?? '—'} />
        <MetaField label="Zone" value={item.zone_name} />
        <MetaField label="Submitted By" value={item.submitter_name ?? '—'} />
        <MetaField label="Impl. Owner" value={item.owner_name ?? '—'} />
        <MetaField label="Submission Date" value={fmtDate(item.submission_date)} />
        <MetaField label="Approval Date" value={fmtDate(item.approval_date)} />
        <MetaField label="Implementation Date" value={fmtDate(item.implementation_date)} />
        <MetaField label="Final Score" value={fmtScore(item.final_score)} accent={item.final_score != null} />
      </div>
    </div>
  )
}

function MetaField({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <span className="text-slate-600 block">{label}</span>
      <span className={accent ? 'text-amber-300 font-semibold' : 'text-slate-300'}>{value}</span>
    </div>
  )
}

// ─── Assign reward modal ──────────────────────────────────────────────────────

function AssignRewardModal({ kaizen, onClose, onSuccess }: {
  kaizen: ApprovedKaizenForRR; onClose: () => void; onSuccess: () => void
}) {
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('')

  const mutation = useMutation({
    mutationFn: () => assignRegularReward(kaizen.kaizen_id, amount ? Number(amount) : null, details || null),
    onSuccess,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-1">Assign Regular R&amp;R</h2>
        <p className="text-slate-400 text-sm mb-5 truncate">{kaizen.title} · {kaizen.registration_id}</p>
        {mutation.isError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{(mutation.error as Error).message}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Reward Amount (optional)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Details (optional)</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm rounded-lg transition-all">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="flex-1 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50">
            {mutation.isPending ? 'Assigning…' : 'Assign Reward'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function StatTile({ value, label, color }: { value: number; label: string; color: 'amber' | 'emerald' | 'indigo' | 'purple' }) {
  const map = {
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    indigo:  'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
    purple:  'bg-purple-500/10 border-purple-500/20 text-purple-300',
  }
  return (
    <div className={`rounded-xl border p-4 ${map[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

export function RewardsQueuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()

  const [activeTab, setActiveTab] = useState<TabId>('approved')
  const [assigningKaizen, setAssigningKaizen] = useState<ApprovedKaizenForRR | null>(null)
  const [nominatingId, setNominatingId] = useState<string | null>(null)
  const [filterOwner, setFilterOwner] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rewards-queue'],
    queryFn: getRewardsQueue,
    staleTime: 30_000,
  })

  const nominateMutation = useMutation({
    mutationFn: (kaizenId: string) => nominateHighImpact(kaizenId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['rewards-queue'] })
      navigate(`/rewards/nominations/${result.nominationId}`)
    },
    onSettled: () => setNominatingId(null),
  })

  const allItems = data ?? []
  const canAssign = hasPermission('CAN_ASSIGN_REWARD') || hasPermission('CAN_NOMINATE_HIGH_IMPACT')

  const ownerOptions = Array.from(
    new Map(allItems.filter((i) => i.owner_name).map((i) => [i.implementation_owner, i.owner_name])).entries(),
  )

  const tabItems = filterByTab(allItems, activeTab)
  const filtered = tabItems.filter((i) => {
    if (filterOwner && i.implementation_owner !== filterOwner) return false
    if (filterStatus === 'none' && (i.reward || i.nomination)) return false
    if (filterStatus === 'reward' && !i.reward) return false
    if (filterStatus === 'nomination' && !i.nomination) return false
    return true
  })

  const tabCount = (tab: TabId) => filterByTab(allItems, tab).length

  return (
    <PageTransition>
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">All Kaizens</h1>
          <p className="text-sm text-slate-400">Manage and review all Kaizens across the organisation</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatTile value={allItems.length} label="Approved Kaizens" color="amber" />
          <StatTile value={allItems.filter((i) => i.reward).length} label="Rewarded" color="emerald" />
          <StatTile value={allItems.filter((i) => i.nomination).length} label="High Impact" color="indigo" />
          <StatTile value={allItems.filter((i) => i.nomination?.nomination_status === 'NOMINATED_SPECIAL' || i.nomination?.nomination_status === 'NOMINATED_INTER_PLANT').length} label="Special / Inter-Plant" color="purple" />
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-5 border-b border-white/5 overflow-x-auto pb-px">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === tab.id ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
              }`}>
              {tab.label}
              {tab.id !== 'rejected' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-600'}`}>
                  {tabCount(tab.id)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-indigo-500/40 min-w-[160px]">
            <option value="">All Owners</option>
            {ownerOptions.map(([id, name]) => <option key={id ?? ''} value={id ?? ''}>{name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-indigo-500/40 min-w-[140px]">
            <option value="">All Statuses</option>
            <option value="none">No Action Yet</option>
            <option value="reward">Rewarded</option>
            <option value="nomination">Nominated</option>
          </select>
          {(filterOwner || filterStatus) && (
            <button onClick={() => { setFilterOwner(''); setFilterStatus('') }} className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors">Clear filters</button>
          )}
          <span className="ml-auto text-xs text-slate-600">{filtered.length} kaizen{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonDetail />
        ) : isError ? (
          <div className="glass rounded-2xl p-8 text-center text-red-400 text-sm">Failed to load rewards queue.</div>
        ) : activeTab === 'rejected' ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 text-base font-medium mb-1">No rejected kaizens</p>
            <p className="text-slate-500 text-sm">Rejected kaizens will appear here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-slate-300 text-base font-medium mb-1">No kaizens found</p>
            <p className="text-slate-500 text-sm">
              {activeTab === 'kaizens_rr' && 'Kaizens will appear here once a regular reward is assigned.'}
              {activeTab === 'high_impact' && 'Kaizens nominated as high impact will appear here.'}
              {activeTab === 'high_impact_rr' && 'Kaizens will appear here once nominated for Special R&R or Inter-Plant.'}
              {activeTab === 'approved' && 'No approved kaizens yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <KaizenCard
                key={item.kaizen_id}
                item={item}
                canAssign={canAssign}
                onAssign={() => setAssigningKaizen(item)}
                onNominate={() => { setNominatingId(item.kaizen_id); nominateMutation.mutate(item.kaizen_id) }}
                isNominating={nominatingId === item.kaizen_id && nominateMutation.isPending}
                onViewNomination={item.nomination ? () => navigate(`/rewards/nominations/${item.nomination!.id}`) : undefined}
                onViewIdea={() => navigate(`/ideas/${item.idea_id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {assigningKaizen && (
        <AssignRewardModal
          kaizen={assigningKaizen}
          onClose={() => setAssigningKaizen(null)}
          onSuccess={() => {
            setAssigningKaizen(null)
            void queryClient.invalidateQueries({ queryKey: ['rewards-queue'] })
          }}
        />
      )}
    </PageTransition>
  )
}
