import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getTrends } from '../../api/analytics.js'
import { PageTransition } from '../../components/PageTransition.js'
import { SkeletonDetail } from '../../components/Skeleton.js'

// ─── Chart theme ──────────────────────────────────────────────────────────────

const GRID_COLOR  = 'rgba(255,255,255,0.06)'
const TICK_STYLE  = { fill: '#64748b', fontSize: 11 }
const TOOLTIP_STYLE = { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }

// ─── Year selector ────────────────────────────────────────────────────────────

function YearSelector({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const current = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => current - i)
  return (
    <select
      value={year}
      onChange={(e) => onChange(Number(e.target.value))}
      className="bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}

// ─── Empty chart placeholder ─────────────────────────────────────────────────

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6 flex items-center justify-center h-48">
      <span className="text-slate-600 text-sm">No {label} data for this period</span>
    </div>
  )
}

// ─── Section card ────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TrendsPage() {
  const [year, setYear] = useState(new Date().getFullYear())

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trends', year],
    queryFn: () => getTrends(year),
    staleTime: 120_000,
  })

  const hasIdeas   = (data?.ideas.some(r => r.submitted > 0 || r.approved > 0 || r.rejected > 0)) ?? false
  const hasKaizens = (data?.kaizens.some(r => r.created > 0 || r.approved > 0)) ?? false
  const hasRewards = (data?.rewards.some(r => r.regular > 0 || r.high_impact > 0)) ?? false

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Monthly Trends</h1>
            <p className="text-sm text-slate-400 mt-1">Ideas, kaizens and rewards by month</p>
          </div>
          <YearSelector year={year} onChange={setYear} />
        </div>

        {isLoading && <SkeletonDetail />}

        {isError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-sm text-red-400">
            Failed to load trends data.
          </div>
        )}

        {data && (
          <div className="flex flex-col gap-6">

            {/* Ideas trend */}
            <ChartCard title="Ideas">
              {!hasIdeas ? <EmptyChart label="ideas" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.ideas} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                    <XAxis dataKey="month" tick={TICK_STYLE} tickLine={false} axisLine={false} />
                    <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Line type="monotone" dataKey="submitted"  stroke="#38bdf8" strokeWidth={2} dot={false} name="Submitted" />
                    <Line type="monotone" dataKey="approved"   stroke="#34d399" strokeWidth={2} dot={false} name="Approved" />
                    <Line type="monotone" dataKey="rejected"   stroke="#f87171" strokeWidth={2} dot={false} name="Rejected" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Kaizens trend */}
            <ChartCard title="Kaizens">
              {!hasKaizens ? <EmptyChart label="kaizens" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.kaizens} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                    <XAxis dataKey="month" tick={TICK_STYLE} tickLine={false} axisLine={false} />
                    <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Bar dataKey="created"   fill="#818cf8" radius={[3,3,0,0]} name="Created" />
                    <Bar dataKey="submitted" fill="#a78bfa" radius={[3,3,0,0]} name="Submitted" />
                    <Bar dataKey="approved"  fill="#34d399" radius={[3,3,0,0]} name="Approved" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Rewards trend */}
            <ChartCard title="Rewards">
              {!hasRewards ? <EmptyChart label="rewards" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.rewards} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                    <XAxis dataKey="month" tick={TICK_STYLE} tickLine={false} axisLine={false} />
                    <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Bar dataKey="regular"     fill="#60a5fa" radius={[3,3,0,0]} name="Regular" />
                    <Bar dataKey="special"     fill="#c084fc" radius={[3,3,0,0]} name="Special" />
                    <Bar dataKey="high_impact" fill="#fbbf24" radius={[3,3,0,0]} name="High Impact" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

          </div>
        )}

      </div>
    </PageTransition>
  )
}
