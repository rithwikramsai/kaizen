import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  getZoneAnalytics,
  getDepartmentAnalytics,
  getCategoryAnalytics,
  getTrends,
  downloadExport,
  type ExportDataset,
} from '../../api/analytics.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

// ─── Chart theme ──────────────────────────────────────────────────────────────

const GRID_COLOR  = 'rgba(255,255,255,0.06)'
const TICK_STYLE  = { fill: '#64748b', fontSize: 11 }
const TOOLTIP_STYLE = { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'trends' | 'zones' | 'departments' | 'categories' | 'exports'

const TABS: { id: Tab; label: string }[] = [
  { id: 'trends',       label: 'Monthly Trends' },
  { id: 'zones',        label: 'Zones' },
  { id: 'departments',  label: 'Departments' },
  { id: 'categories',   label: 'Categories' },
  { id: 'exports',      label: 'Exports' },
]

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 w-fit mb-6">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            active === t.id
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Chart card ──────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ─── Zones chart ─────────────────────────────────────────────────────────────

function ZonesChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'zones'],
    queryFn: getZoneAnalytics,
    staleTime: 120_000,
  })

  if (isLoading) return <SkeletonDetail />
  if (isError) return <div className="text-red-400 text-sm">Failed to load zone data.</div>
  if (!data?.length) return <div className="text-slate-500 text-sm py-8 text-center">No zone data available.</div>

  return (
    <ChartCard title="Ideas, Kaizens & Rewards by Zone">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 40, left: -16 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="zone_name" tick={{ ...TICK_STYLE, angle: -35, textAnchor: 'end' }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="ideas"   fill="#38bdf8" radius={[3,3,0,0]} name="Ideas" />
          <Bar dataKey="kaizens" fill="#818cf8" radius={[3,3,0,0]} name="Kaizens" />
          <Bar dataKey="rewards" fill="#34d399" radius={[3,3,0,0]} name="Rewards" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Departments chart ────────────────────────────────────────────────────────

function DepartmentsChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'departments'],
    queryFn: getDepartmentAnalytics,
    staleTime: 120_000,
  })

  if (isLoading) return <SkeletonDetail />
  if (isError) return <div className="text-red-400 text-sm">Failed to load department data.</div>
  if (!data?.length) return <div className="text-slate-500 text-sm py-8 text-center">No department data available.</div>

  return (
    <ChartCard title="Ideas, Kaizens & Rewards by Department">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 80 }}>
          <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
          <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="department_name" tick={TICK_STYLE} tickLine={false} axisLine={false} width={76} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Bar dataKey="ideas"   fill="#38bdf8" radius={[0,3,3,0]} name="Ideas" />
          <Bar dataKey="kaizens" fill="#818cf8" radius={[0,3,3,0]} name="Kaizens" />
          <Bar dataKey="rewards" fill="#34d399" radius={[0,3,3,0]} name="Rewards" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Categories chart ─────────────────────────────────────────────────────────

function CategoriesChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: getCategoryAnalytics,
    staleTime: 120_000,
  })

  if (isLoading) return <SkeletonDetail />
  if (isError) return <div className="text-red-400 text-sm">Failed to load category data.</div>
  if (!data?.length) return <div className="text-slate-500 text-sm py-8 text-center">No category data available.</div>

  return (
    <ChartCard title="Idea Count by Category">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 100 }}>
          <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
          <XAxis type="number" tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="category_name" tick={TICK_STYLE} tickLine={false} axisLine={false} width={96} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
          <Bar dataKey="idea_count" fill="#a78bfa" radius={[0,3,3,0]} name="Ideas" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Exports panel ────────────────────────────────────────────────────────────

const EXPORT_ROWS: { dataset: ExportDataset; label: string; description: string }[] = [
  { dataset: 'ideas',       label: 'Ideas',       description: 'All ideas with status, zone, category, submitter' },
  { dataset: 'kaizens',     label: 'Kaizens',     description: 'All kaizens with status, zone, implementation owner' },
  { dataset: 'rewards',     label: 'Rewards',     description: 'All rewards with type, amount, assigned date' },
  { dataset: 'leaderboard', label: 'Leaderboard', description: 'Owner leaderboard with kaizen and reward counts' },
]

function ExportsPanel() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleDownload = async (format: 'csv' | 'xlsx', dataset: ExportDataset) => {
    const key = `${format}-${dataset}`
    setLoading(key)
    try {
      await downloadExport(format, dataset)
    } catch {
      // Silently fail — browser will show download error
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {EXPORT_ROWS.map((row) => (
        <div key={row.dataset} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">{row.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{row.description}</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => void handleDownload('csv', row.dataset)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-medium bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-lg hover:bg-sky-500/20 transition-colors disabled:opacity-50"
            >
              {loading === `csv-${row.dataset}` ? '…' : 'CSV'}
            </button>
            <button
              onClick={() => void handleDownload('xlsx', row.dataset)}
              disabled={loading !== null}
              className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {loading === `xlsx-${row.dataset}` ? '…' : 'XLSX'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function TrendsTab() {
  const [year, setYear] = useState(new Date().getFullYear())
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trends', year],
    queryFn: () => getTrends(year),
    staleTime: 120_000,
  })
  const hasIdeas   = data?.ideas.some(r => r.submitted > 0 || r.approved > 0 || r.rejected > 0) ?? false
  const hasKaizens = data?.kaizens.some(r => r.created > 0 || r.approved > 0) ?? false
  const hasRewards = data?.rewards.some(r => r.regular > 0 || r.high_impact > 0) ?? false

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Ideas, kaizens and rewards by month</p>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {isLoading && <SkeletonDetail />}
      {isError && <div className="text-red-400 text-sm">Failed to load trends data.</div>}
      {data && (
        <>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Ideas</h3>
            {!hasIdeas ? <div className="text-slate-600 text-sm py-8 text-center">No idea data for this period</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.ideas} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="month" tick={TICK_STYLE} tickLine={false} axisLine={false} />
                  <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Line type="monotone" dataKey="submitted" stroke="#38bdf8" strokeWidth={2} dot={false} name="Submitted" />
                  <Line type="monotone" dataKey="approved" stroke="#34d399" strokeWidth={2} dot={false} name="Approved" />
                  <Line type="monotone" dataKey="rejected" stroke="#f87171" strokeWidth={2} dot={false} name="Rejected" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Kaizens</h3>
            {!hasKaizens ? <div className="text-slate-600 text-sm py-8 text-center">No kaizen data for this period</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.kaizens} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="month" tick={TICK_STYLE} tickLine={false} axisLine={false} />
                  <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="created" fill="#818cf8" radius={[3,3,0,0]} name="Created" />
                  <Bar dataKey="approved" fill="#34d399" radius={[3,3,0,0]} name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Rewards</h3>
            {!hasRewards ? <div className="text-slate-600 text-sm py-8 text-center">No reward data for this period</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.rewards} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="month" tick={TICK_STYLE} tickLine={false} axisLine={false} />
                  <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Bar dataKey="regular" fill="#60a5fa" radius={[3,3,0,0]} name="Regular" />
                  <Bar dataKey="special" fill="#c084fc" radius={[3,3,0,0]} name="Special" />
                  <Bar dataKey="high_impact" fill="#fbbf24" radius={[3,3,0,0]} name="High Impact" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('trends')

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Trends, breakdowns by zone, department, category — plus data exports</p>
        </div>

        <TabBar active={tab} onChange={setTab} />

        {tab === 'trends'      && <TrendsTab />}
        {tab === 'zones'       && <ZonesChart />}
        {tab === 'departments' && <DepartmentsChart />}
        {tab === 'categories'  && <CategoriesChart />}
        {tab === 'exports'     && <ExportsPanel />}

      </div>
    </PageTransition>
  )
}
