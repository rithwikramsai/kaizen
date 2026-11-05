import { authFetch, authFetchList } from './client.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  users: { total: number; active: number; inactive: number }
  org: { plants: number; zones: number; departments: number }
  workflows: { active: number; overdue: number }
  notifications: { total: number }
  rewards: { total: number }
}

export interface TemplateStep {
  id: string
  step_order: number
  stage_code: string
  assigned_role: string
  is_dynamic: boolean
  sla_hours: number | null
}

export interface WorkflowTemplate {
  id: string
  workflow_type: string
  name: string
  is_active: boolean
  steps: TemplateStep[]
}

export interface SlaConfig {
  id: string
  plant_id: string
  plant_name: string | null
  stage_code: string
  workflow_type: string
  sla_hours: number
  reminder_hrs: number | null
  is_active: boolean
}

export interface AuditLogRow {
  id: string
  performed_by: string | null
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: string
  payload: unknown
  performed_at: string
}

export interface AuditLogsResult {
  rows: AuditLogRow[]
  total: number
}

export interface SystemHealth {
  database: 'ok' | 'error'
  totals: { users: number; ideas: number; kaizens: number }
  pending_workflows: number
  unread_notifications: number
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export function fetchAdminDashboard(): Promise<AdminDashboard> {
  return authFetch<AdminDashboard>('/admin/dashboard')
}

// ─── Workflow Templates ───────────────────────────────────────────────────────

export function fetchWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  return authFetch<WorkflowTemplate[]>('/admin/workflow-templates')
}

export function fetchWorkflowTemplateById(id: string): Promise<WorkflowTemplate> {
  return authFetch<WorkflowTemplate>(`/admin/workflow-templates/${id}`)
}

export function createWorkflowTemplate(input: { workflow_type: string; name: string }): Promise<WorkflowTemplate> {
  return authFetch<WorkflowTemplate>('/admin/workflow-templates', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ─── SLA Configs ──────────────────────────────────────────────────────────────

export function fetchSlaConfigs(plantId?: string): Promise<SlaConfig[]> {
  const qs = plantId ? `?plant_id=${encodeURIComponent(plantId)}` : ''
  return authFetch<SlaConfig[]>(`/admin/sla-configs${qs}`)
}

export function patchSlaConfig(id: string, slaHours: number): Promise<SlaConfig> {
  return authFetch<SlaConfig>(`/admin/sla-configs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sla_hours: slaHours }),
  })
}

export interface CreateSlaConfigInput {
  plant_id: string
  stage_code: string
  workflow_type: string
  sla_hours: number
  reminder_hrs?: number
}

export function createSlaConfig(input: CreateSlaConfigInput): Promise<SlaConfig> {
  return authFetch<SlaConfig>('/admin/sla-configs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLogQuery {
  page?: number
  page_size?: number
  from_date?: string
  to_date?: string
  action?: string
  entity_type?: string
  actor_id?: string
}

export function fetchAuditLogs(params: AuditLogQuery = {}): Promise<AuditLogsResult> {
  const qs = new URLSearchParams()
  if (params.page)        qs.set('page',        String(params.page))
  if (params.page_size)   qs.set('page_size',   String(params.page_size))
  if (params.from_date)   qs.set('from_date',   params.from_date)
  if (params.to_date)     qs.set('to_date',     params.to_date)
  if (params.action)      qs.set('action',      params.action)
  if (params.entity_type) qs.set('entity_type', params.entity_type)
  if (params.actor_id)    qs.set('actor_id',    params.actor_id)
  const query = qs.toString()
  return authFetchList<AuditLogRow>(`/admin/audit-logs${query ? `?${query}` : ''}`)
}

// ─── System Health ────────────────────────────────────────────────────────────

export function fetchSystemHealth(): Promise<SystemHealth> {
  return authFetch<SystemHealth>('/admin/system-health')
}
