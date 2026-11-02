import { authFetch } from './client.js'

export interface DashboardData {
  ideas: {
    total: number
    submitted: number
    under_review: number
    approved: number
    rejected: number
  }
  kaizens: {
    in_progress: number
    submitted: number
    approved: number
  }
  rewards: {
    regular: number
    special: number
    high_impact: number
  }
  sla: {
    overdue: number
    due_today: number
    within_sla: number
  }
}

export function getDashboardData(): Promise<DashboardData> {
  return authFetch<DashboardData>('/reports/dashboard')
}
