import { pool } from '../config/database.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'

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

export interface AuditLogFilters {
  from_date?: string | undefined
  to_date?: string | undefined
  action?: string | undefined
  entity_type?: string | undefined
  actor_id?: string | undefined
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

export interface SystemHealth {
  database: 'ok' | 'error'
  totals: { users: number; ideas: number; kaizens: number }
  pending_workflows: number
  failed_notifications: number
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const [usersRes, orgRes, workflowsRes, notificationsRes, rewardsRes] = await Promise.all([
    pool.query<{ total: number; active: number; inactive: number }>(
      `SELECT
         COUNT(*)::int                                     AS total,
         COUNT(*) FILTER (WHERE is_active = TRUE)::int    AS active,
         COUNT(*) FILTER (WHERE is_active = FALSE)::int   AS inactive
       FROM users`,
    ),
    pool.query<{ plants: number; zones: number; departments: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM plants       WHERE is_active = TRUE) AS plants,
         (SELECT COUNT(*)::int FROM zones        WHERE is_active = TRUE) AS zones,
         (SELECT COUNT(*)::int FROM departments  WHERE is_active = TRUE) AS departments`,
    ),
    pool.query<{ active: number; overdue: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM workflow_instances
          WHERE current_status NOT IN ('COMPLETED', 'REJECTED')) AS active,
         (SELECT COUNT(*)::int FROM workflow_steps
          WHERE status = 'PENDING' AND sla_due_at < NOW())       AS overdue`,
    ),
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM notifications`,
    ),
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM rewards`,
    ),
  ])

  const u = usersRes.rows[0]!
  const o = orgRes.rows[0]!
  const w = workflowsRes.rows[0]!

  return {
    users:         { total: u.total, active: u.active, inactive: u.inactive },
    org:           { plants: o.plants, zones: o.zones, departments: o.departments },
    workflows:     { active: w.active, overdue: w.overdue },
    notifications: { total: notificationsRes.rows[0]!.total },
    rewards:       { total: rewardsRes.rows[0]!.total },
  }
}

// ─── Workflow Templates ───────────────────────────────────────────────────────

export async function listWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const templatesRes = await pool.query<{
    id: string; workflow_type: string; name: string; is_active: boolean
  }>(
    `SELECT id, workflow_type, name, is_active FROM workflow_templates ORDER BY workflow_type`,
  )

  if (templatesRes.rows.length === 0) return []

  const templateIds = templatesRes.rows.map((t) => t.id)
  const stepsRes = await pool.query<{
    id: string; template_id: string; step_order: number; stage_code: string
    assigned_role: string; is_dynamic: boolean; sla_hours: number | null
  }>(
    `SELECT id, template_id, step_order, stage_code, assigned_role, is_dynamic, sla_hours
     FROM workflow_template_steps
     WHERE template_id = ANY($1)
     ORDER BY template_id, step_order ASC`,
    [templateIds],
  )

  const stepsByTemplate = new Map<string, TemplateStep[]>()
  for (const s of stepsRes.rows) {
    if (!stepsByTemplate.has(s.template_id)) stepsByTemplate.set(s.template_id, [])
    stepsByTemplate.get(s.template_id)!.push({
      id: s.id,
      step_order: s.step_order,
      stage_code: s.stage_code,
      assigned_role: s.assigned_role,
      is_dynamic: s.is_dynamic,
      sla_hours: s.sla_hours,
    })
  }

  return templatesRes.rows.map((t) => ({
    id: t.id,
    workflow_type: t.workflow_type,
    name: t.name,
    is_active: t.is_active,
    steps: stepsByTemplate.get(t.id) ?? [],
  }))
}

export async function getWorkflowTemplateById(id: string): Promise<WorkflowTemplate> {
  const tRes = await pool.query<{
    id: string; workflow_type: string; name: string; is_active: boolean
  }>(
    `SELECT id, workflow_type, name, is_active FROM workflow_templates WHERE id = $1`,
    [id],
  )
  const template = tRes.rows[0]
  if (!template) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Workflow template not found')

  const sRes = await pool.query<{
    id: string; step_order: number; stage_code: string
    assigned_role: string; is_dynamic: boolean; sla_hours: number | null
  }>(
    `SELECT id, step_order, stage_code, assigned_role, is_dynamic, sla_hours
     FROM workflow_template_steps
     WHERE template_id = $1
     ORDER BY step_order ASC`,
    [id],
  )

  return {
    id: template.id,
    workflow_type: template.workflow_type,
    name: template.name,
    is_active: template.is_active,
    steps: sRes.rows.map((s) => ({
      id: s.id,
      step_order: s.step_order,
      stage_code: s.stage_code,
      assigned_role: s.assigned_role,
      is_dynamic: s.is_dynamic,
      sla_hours: s.sla_hours,
    })),
  }
}

// ─── SLA Configs ──────────────────────────────────────────────────────────────

export async function listSlaConfigs(plantId?: string | undefined): Promise<SlaConfig[]> {
  const params: unknown[] = []
  let where = ''
  if (plantId) {
    params.push(plantId)
    where = 'WHERE sc.plant_id = $1'
  }

  const res = await pool.query<{
    id: string; plant_id: string; plant_name: string | null
    stage_code: string; workflow_type: string
    sla_hours: number; reminder_hrs: number | null; is_active: boolean
  }>(
    `SELECT sc.id, sc.plant_id, p.name AS plant_name,
            sc.stage_code, sc.workflow_type,
            sc.sla_hours, sc.reminder_hrs, sc.is_active
     FROM sla_configs sc
     LEFT JOIN plants p ON p.id = sc.plant_id
     ${where}
     ORDER BY p.name, sc.workflow_type, sc.stage_code`,
    params,
  )

  return res.rows.map((r) => ({
    id: r.id,
    plant_id: r.plant_id,
    plant_name: r.plant_name,
    stage_code: r.stage_code,
    workflow_type: r.workflow_type,
    sla_hours: r.sla_hours,
    reminder_hrs: r.reminder_hrs,
    is_active: r.is_active,
  }))
}

export async function updateSlaConfig(id: string, slaHours: number): Promise<SlaConfig> {
  const res = await pool.query<{
    id: string; plant_id: string; stage_code: string; workflow_type: string
    sla_hours: number; reminder_hrs: number | null; is_active: boolean
  }>(
    `UPDATE sla_configs SET sla_hours = $1 WHERE id = $2
     RETURNING id, plant_id, stage_code, workflow_type, sla_hours, reminder_hrs, is_active`,
    [slaHours, id],
  )
  const row = res.rows[0]
  if (!row) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'SLA config not found')

  const plantRes = await pool.query<{ name: string }>(
    `SELECT name FROM plants WHERE id = $1`,
    [row.plant_id],
  )

  return {
    id: row.id,
    plant_id: row.plant_id,
    plant_name: plantRes.rows[0]?.name ?? null,
    stage_code: row.stage_code,
    workflow_type: row.workflow_type,
    sla_hours: row.sla_hours,
    reminder_hrs: row.reminder_hrs,
    is_active: row.is_active,
  }
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getAuditLogs(
  filters: AuditLogFilters,
  pagination: { offset: number; pageSize: number },
): Promise<{ rows: AuditLogRow[]; total: number }> {
  const params: unknown[] = []
  const conditions: string[] = []

  if (filters.from_date) {
    params.push(filters.from_date)
    conditions.push(`al.performed_at >= $${params.length}`)
  }
  if (filters.to_date) {
    params.push(filters.to_date)
    conditions.push(`al.performed_at < ($${params.length}::date + interval '1 day')`)
  }
  if (filters.action) {
    params.push(filters.action)
    conditions.push(`al.action = $${params.length}`)
  }
  if (filters.entity_type) {
    params.push(filters.entity_type)
    conditions.push(`al.entity_type = $${params.length}`)
  }
  if (filters.actor_id) {
    params.push(filters.actor_id)
    conditions.push(`al.performed_by = $${params.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM audit_logs al ${where}`,
    params,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  params.push(pagination.pageSize, pagination.offset)
  const rowsRes = await pool.query<{
    id: string; performed_by: string | null; actor_name: string | null
    action: string; entity_type: string; entity_id: string; payload: unknown; performed_at: Date
  }>(
    `SELECT al.id, al.performed_by, u.full_name AS actor_name,
            al.action, al.entity_type, al.entity_id, al.payload, al.performed_at
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.performed_by
     ${where}
     ORDER BY al.performed_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )

  return {
    total,
    rows: rowsRes.rows.map((r) => ({
      id: r.id,
      performed_by: r.performed_by,
      actor_name: r.actor_name,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      payload: r.payload,
      performed_at: (r.performed_at as Date).toISOString(),
    })),
  }
}

// ─── System Health ────────────────────────────────────────────────────────────

export async function getSystemHealth(): Promise<SystemHealth> {
  let dbStatus: 'ok' | 'error' = 'ok'
  try {
    await pool.query('SELECT 1')
  } catch {
    dbStatus = 'error'
  }

  const [totalsRes, pendingRes, failedNotifRes] = await Promise.all([
    pool.query<{ users: number; ideas: number; kaizens: number }>(
      `SELECT
         (SELECT COUNT(*)::int FROM users)   AS users,
         (SELECT COUNT(*)::int FROM ideas)   AS ideas,
         (SELECT COUNT(*)::int FROM kaizens) AS kaizens`,
    ),
    pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM workflow_steps WHERE status = 'PENDING'`,
    ),
    pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE is_read = FALSE`,
    ),
  ])

  const t = totalsRes.rows[0]!

  return {
    database: dbStatus,
    totals: { users: t.users, ideas: t.ideas, kaizens: t.kaizens },
    pending_workflows: pendingRes.rows[0]!.count,
    failed_notifications: failedNotifRes.rows[0]!.count,
  }
}
