import { authFetch, API_BASE, TOKEN_KEY } from './client.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IdeaMonthPoint { month: string; submitted: number; approved: number; rejected: number }
export interface KaizenMonthPoint { month: string; created: number; submitted: number; approved: number }
export interface RewardMonthPoint { month: string; regular: number; special: number; high_impact: number }

export interface TrendsData {
  ideas: IdeaMonthPoint[]
  kaizens: KaizenMonthPoint[]
  rewards: RewardMonthPoint[]
}

export interface PlantSummary {
  plant_id: string; plant_name: string
  ideas: number; approved_ideas: number; kaizens: number; rewards: number; high_impact: number
}

export interface ZoneSummary {
  zone_id: string; zone_name: string; ideas: number; kaizens: number; rewards: number
}

export interface DepartmentSummary {
  department_id: string; department_name: string; ideas: number; kaizens: number; rewards: number
}

export interface CategorySummary {
  category_id: string; category_name: string; idea_count: number
}

export interface OverdueStep {
  step_id: string; stage_code: string; entity_type: string; entity_id: string
  registration_id: string | null; title: string | null; sla_due_at: string
  hours_overdue: number; assigned_user_name: string | null
}

export interface SLAReport {
  avg_step_time_hours: number | null
  avg_implementation_time_hours: number | null
  overdue_count: number
  total_pending_with_sla: number
  compliance_pct: number
  overdue_steps: OverdueStep[]
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function getTrends(year: number): Promise<TrendsData> {
  return authFetch<TrendsData>(`/analytics/trends?year=${year}`)
}

export function getPlantAnalytics(): Promise<PlantSummary[]> {
  return authFetch<PlantSummary[]>('/analytics/plants')
}

export function getZoneAnalytics(): Promise<ZoneSummary[]> {
  return authFetch<ZoneSummary[]>('/analytics/zones')
}

export function getDepartmentAnalytics(): Promise<DepartmentSummary[]> {
  return authFetch<DepartmentSummary[]>('/analytics/departments')
}

export function getCategoryAnalytics(): Promise<CategorySummary[]> {
  return authFetch<CategorySummary[]>('/analytics/categories')
}

export function getSLAReport(): Promise<SLAReport> {
  return authFetch<SLAReport>('/analytics/sla')
}

export type ExportDataset = 'ideas' | 'kaizens' | 'rewards' | 'leaderboard'

export async function downloadExport(format: 'csv' | 'xlsx', dataset: ExportDataset): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${API_BASE}/analytics/export/${format}?dataset=${dataset}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${dataset}-export.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
