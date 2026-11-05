import { pool } from '../config/database.js'
import XLSX from 'xlsx'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthPoint {
  month: string
}

export interface IdeaMonthPoint extends MonthPoint {
  submitted: number
  approved: number
  rejected: number
}

export interface KaizenMonthPoint extends MonthPoint {
  created: number
  submitted: number
  approved: number
}

export interface RewardMonthPoint extends MonthPoint {
  regular: number
  special: number
  high_impact: number
}

export interface TrendsData {
  ideas: IdeaMonthPoint[]
  kaizens: KaizenMonthPoint[]
  rewards: RewardMonthPoint[]
}

export interface PlantSummary {
  plant_id: string
  plant_name: string
  ideas: number
  approved_ideas: number
  kaizens: number
  rewards: number
  high_impact: number
}

export interface ZoneSummary {
  zone_id: string
  zone_name: string
  ideas: number
  kaizens: number
  rewards: number
}

export interface DepartmentSummary {
  department_id: string
  department_name: string
  ideas: number
  kaizens: number
  rewards: number
}

export interface CategorySummary {
  category_id: string
  category_name: string
  idea_count: number
}

export interface SLAReport {
  avg_step_time_hours: number | null
  avg_implementation_time_hours: number | null
  overdue_count: number
  total_pending_with_sla: number
  compliance_pct: number
  overdue_steps: OverdueStep[]
}

export interface OverdueStep {
  step_id: string
  stage_code: string
  entity_type: string
  entity_id: string
  registration_id: string | null
  title: string | null
  sla_due_at: string
  hours_overdue: number
  assigned_user_name: string | null
}

export type ExportDataset = 'ideas' | 'kaizens' | 'rewards' | 'leaderboard'

// ─── Monthly Trends ───────────────────────────────────────────────────────────

export async function getMonthlyTrends(plantId: string, year: number): Promise<TrendsData> {
  const [ideasRes, kaizensRes, rewardsRes] = await Promise.all([
    pool.query<IdeaMonthPoint>(
      `WITH months AS (
         SELECT generate_series(
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)),
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)) + INTERVAL '11 months',
           INTERVAL '1 month'
         ) AS month
       )
       SELECT
         TO_CHAR(m.month, 'YYYY-MM') AS month,
         COUNT(i.id) FILTER (WHERE i.submitted_at IS NOT NULL)::int  AS submitted,
         COUNT(i.id) FILTER (WHERE i.status = 'APPROVED')::int       AS approved,
         COUNT(i.id) FILTER (WHERE i.status = 'REJECTED')::int       AS rejected
       FROM months m
       LEFT JOIN ideas i
         ON i.plant_id = $1
        AND DATE_TRUNC('month', COALESCE(i.submitted_at, i.created_at)) = m.month
       GROUP BY m.month
       ORDER BY m.month`,
      [plantId, year],
    ),

    pool.query<KaizenMonthPoint>(
      `WITH months AS (
         SELECT generate_series(
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)),
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)) + INTERVAL '11 months',
           INTERVAL '1 month'
         ) AS month
       )
       SELECT
         TO_CHAR(m.month, 'YYYY-MM') AS month,
         COUNT(k.id)::int                                                           AS created,
         COUNT(k.id) FILTER (WHERE k.one_pager_submitted_at IS NOT NULL)::int      AS submitted,
         COUNT(k.id) FILTER (WHERE k.status = 'APPROVED')::int                    AS approved
       FROM months m
       LEFT JOIN kaizens k
         ON DATE_TRUNC('month', k.created_at) = m.month
        AND k.idea_id IN (SELECT id FROM ideas WHERE plant_id = $1)
       GROUP BY m.month
       ORDER BY m.month`,
      [plantId, year],
    ),

    pool.query<RewardMonthPoint>(
      `WITH months AS (
         SELECT generate_series(
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)),
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)) + INTERVAL '11 months',
           INTERVAL '1 month'
         ) AS month
       )
       SELECT
         TO_CHAR(m.month, 'YYYY-MM') AS month,
         COALESCE(r.regular, 0)::int      AS regular,
         COALESCE(r.special, 0)::int      AS special,
         COALESCE(h.high_impact, 0)::int  AS high_impact
       FROM months m
       LEFT JOIN (
         SELECT
           DATE_TRUNC('month', rw.assigned_at) AS month,
           COUNT(*) FILTER (WHERE rw.reward_type = 'REGULAR') AS regular,
           COUNT(*) FILTER (WHERE rw.reward_type = 'SPECIAL') AS special
         FROM rewards rw
         JOIN kaizens k ON k.id = rw.kaizen_id
         JOIN ideas i   ON i.id = k.idea_id
         WHERE i.plant_id = $1
         GROUP BY DATE_TRUNC('month', rw.assigned_at)
       ) r ON r.month = m.month
       LEFT JOIN (
         SELECT
           DATE_TRUNC('month', hin.nominated_at) AS month,
           COUNT(*) AS high_impact
         FROM high_impact_nominations hin
         JOIN kaizens k ON k.id = hin.kaizen_id
         JOIN ideas i   ON i.id = k.idea_id
         WHERE i.plant_id = $1
         GROUP BY DATE_TRUNC('month', hin.nominated_at)
       ) h ON h.month = m.month
       ORDER BY m.month`,
      [plantId, year],
    ),
  ])

  return {
    ideas:   ideasRes.rows,
    kaizens: kaizensRes.rows,
    rewards: rewardsRes.rows,
  }
}

// ─── Weekly Trends ────────────────────────────────────────────────────────────

export interface WeeklyPoint {
  week: string      // ISO week label e.g. "2026-W01"
  week_start: string
  submitted: number
  approved: number
}

export async function getWeeklyTrends(plantId: string, year: number): Promise<WeeklyPoint[]> {
  const res = await pool.query<{ week: string; week_start: string; submitted: number; approved: number }>(
    `WITH weeks AS (
       SELECT
         generate_series(
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)),
           DATE_TRUNC('year', MAKE_DATE($2, 1, 1)) + INTERVAL '52 weeks',
           INTERVAL '1 week'
         ) AS week_start
     )
     SELECT
       TO_CHAR(w.week_start, 'IYYY-"W"IW') AS week,
       TO_CHAR(w.week_start, 'YYYY-MM-DD') AS week_start,
       COUNT(i.id) FILTER (WHERE i.submitted_at IS NOT NULL)::int AS submitted,
       COUNT(i.id) FILTER (WHERE i.status = 'APPROVED')::int      AS approved
     FROM weeks w
     LEFT JOIN ideas i
       ON i.plant_id = $1
      AND DATE_TRUNC('week', COALESCE(i.submitted_at, i.created_at)) = w.week_start
      AND EXTRACT(YEAR FROM COALESCE(i.submitted_at, i.created_at)) = $2
     GROUP BY w.week_start
     ORDER BY w.week_start`,
    [plantId, year],
  )
  return res.rows
}

// ─── Plant Analytics ──────────────────────────────────────────────────────────

export async function getPlantAnalytics(plantId: string): Promise<PlantSummary[]> {
  const res = await pool.query<PlantSummary>(
    `SELECT
       p.id                                                              AS plant_id,
       p.name                                                            AS plant_name,
       COUNT(DISTINCT i.id)::int                                        AS ideas,
       COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'APPROVED')::int  AS approved_ideas,
       COUNT(DISTINCT k.id)::int                                        AS kaizens,
       COUNT(DISTINCT r.id)::int                                        AS rewards,
       COUNT(DISTINCT hin.id)::int                                      AS high_impact
     FROM plants p
     LEFT JOIN ideas i   ON i.plant_id = p.id
     LEFT JOIN kaizens k ON k.idea_id = i.id
     LEFT JOIN rewards r ON r.kaizen_id = k.id
     LEFT JOIN high_impact_nominations hin ON hin.kaizen_id = k.id
     WHERE p.id = $1
     GROUP BY p.id, p.name`,
    [plantId],
  )
  return res.rows
}

// ─── Zone Analytics ───────────────────────────────────────────────────────────

export async function getZoneAnalytics(plantId: string): Promise<ZoneSummary[]> {
  const res = await pool.query<ZoneSummary>(
    `SELECT
       z.id                  AS zone_id,
       z.name                AS zone_name,
       COUNT(DISTINCT i.id)::int  AS ideas,
       COUNT(DISTINCT k.id)::int  AS kaizens,
       COUNT(DISTINCT r.id)::int  AS rewards
     FROM zones z
     LEFT JOIN ideas i   ON i.zone_id = z.id AND i.plant_id = $1
     LEFT JOIN kaizens k ON k.idea_id = i.id
     LEFT JOIN rewards r ON r.kaizen_id = k.id
     WHERE z.plant_id = $1
     GROUP BY z.id, z.name
     ORDER BY COUNT(DISTINCT i.id) DESC`,
    [plantId],
  )
  return res.rows
}

// ─── Department Analytics ─────────────────────────────────────────────────────

export async function getDepartmentAnalytics(plantId: string): Promise<DepartmentSummary[]> {
  const res = await pool.query<DepartmentSummary>(
    `SELECT
       d.id                  AS department_id,
       d.name                AS department_name,
       COUNT(DISTINCT i.id)::int  AS ideas,
       COUNT(DISTINCT k.id)::int  AS kaizens,
       COUNT(DISTINCT r.id)::int  AS rewards
     FROM departments d
     JOIN zones z ON z.id = d.zone_id AND z.plant_id = $1
     LEFT JOIN ideas i   ON i.department_id = d.id AND i.plant_id = $1
     LEFT JOIN kaizens k ON k.idea_id = i.id
     LEFT JOIN rewards r ON r.kaizen_id = k.id
     GROUP BY d.id, d.name
     ORDER BY COUNT(DISTINCT i.id) DESC`,
    [plantId],
  )
  return res.rows
}

// ─── Category Analytics ───────────────────────────────────────────────────────

export async function getCategoryAnalytics(plantId: string): Promise<CategorySummary[]> {
  const res = await pool.query<CategorySummary>(
    `SELECT
       c.id         AS category_id,
       c.name       AS category_name,
       COUNT(i.id)::int AS idea_count
     FROM categories c
     LEFT JOIN ideas i ON i.category_id = c.id AND i.plant_id = $1
     GROUP BY c.id, c.name
     ORDER BY COUNT(i.id) DESC`,
    [plantId],
  )
  return res.rows
}

// ─── SLA Report ───────────────────────────────────────────────────────────────

export async function getSLAReport(plantId: string): Promise<SLAReport> {
  const [avgRes, overdueRes, complianceRes] = await Promise.all([
    // Average step completion time
    pool.query<{ avg_step_time_hours: number | null; avg_impl_hours: number | null }>(
      `SELECT
         ROUND(
           AVG(
             EXTRACT(EPOCH FROM (ws.action_taken_at - ws.action_assigned_at)) / 3600.0
           )::numeric, 2
         ) AS avg_step_time_hours,
         NULL::numeric AS avg_impl_hours
       FROM workflow_steps ws
       JOIN workflow_instances wi ON wi.id = ws.workflow_instance_id
       WHERE ws.status IN ('APPROVED', 'REJECTED')
         AND ws.action_taken_at IS NOT NULL
         AND ws.action_assigned_at IS NOT NULL
         AND (
           (wi.entity_type = 'idea'   AND wi.entity_id IN (SELECT id FROM ideas WHERE plant_id = $1))
           OR
           (wi.entity_type = 'kaizen' AND wi.entity_id IN (
             SELECT k.id FROM kaizens k JOIN ideas i ON i.id = k.idea_id WHERE i.plant_id = $1
           ))
         )`,
      [plantId],
    ),

    // Overdue steps detail
    pool.query<{
      step_id: string
      stage_code: string
      entity_type: string
      entity_id: string
      registration_id: string | null
      title: string | null
      sla_due_at: Date
      hours_overdue: number
      assigned_user_name: string | null
    }>(
      `SELECT
         ws.id                                                            AS step_id,
         ws.stage_code,
         wi.entity_type,
         wi.entity_id,
         COALESCE(i.registration_id, k.kaizen_id)                       AS registration_id,
         COALESCE(i.title, k.title)                                      AS title,
         ws.sla_due_at,
         ROUND(EXTRACT(EPOCH FROM (NOW() - ws.sla_due_at)) / 3600.0)::int AS hours_overdue,
         u.full_name                                                      AS assigned_user_name
       FROM workflow_steps ws
       JOIN workflow_instances wi ON wi.id = ws.workflow_instance_id
       LEFT JOIN ideas i
         ON wi.entity_type = 'idea' AND wi.entity_id = i.id
       LEFT JOIN kaizens k
         ON wi.entity_type = 'kaizen' AND wi.entity_id = k.id
       LEFT JOIN users u ON u.id = ws.assigned_user_id
       WHERE ws.status = 'PENDING'
         AND ws.sla_due_at < NOW()
         AND ws.sla_due_at IS NOT NULL
         AND (
           (wi.entity_type = 'idea'   AND i.plant_id = $1)
           OR
           (wi.entity_type = 'kaizen' AND k.idea_id IN (
             SELECT id FROM ideas WHERE plant_id = $1
           ))
         )
       ORDER BY ws.sla_due_at ASC`,
      [plantId],
    ),

    // Compliance stats
    pool.query<{ total_with_sla: number; completed_on_time: number; overdue_count: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE ws.sla_due_at IS NOT NULL AND ws.status = 'PENDING')::int AS total_with_sla,
         COUNT(*) FILTER (
           WHERE ws.sla_due_at IS NOT NULL
             AND ws.status IN ('APPROVED', 'REJECTED')
             AND ws.action_taken_at <= ws.sla_due_at
         )::int AS completed_on_time,
         COUNT(*) FILTER (WHERE ws.sla_due_at < NOW() AND ws.status = 'PENDING')::int AS overdue_count
       FROM workflow_steps ws
       JOIN workflow_instances wi ON wi.id = ws.workflow_instance_id
       WHERE (
         (wi.entity_type = 'idea'   AND wi.entity_id IN (SELECT id FROM ideas WHERE plant_id = $1))
         OR
         (wi.entity_type = 'kaizen' AND wi.entity_id IN (
           SELECT k.id FROM kaizens k JOIN ideas i ON i.id = k.idea_id WHERE i.plant_id = $1
         ))
       )`,
      [plantId],
    ),
  ])

  const avg           = avgRes.rows[0]!
  const compliance    = complianceRes.rows[0]!
  const overdueSteps  = overdueRes.rows

  const totalBase = compliance.total_with_sla + (compliance.completed_on_time ?? 0)
  const compliancePct = totalBase > 0
    ? Math.round((compliance.completed_on_time / totalBase) * 100)
    : 100

  return {
    avg_step_time_hours:           avg.avg_step_time_hours,
    avg_implementation_time_hours: null,
    overdue_count:                 compliance.overdue_count,
    total_pending_with_sla:        compliance.total_with_sla,
    compliance_pct:                compliancePct,
    overdue_steps: overdueSteps.map((s) => ({
      step_id:            s.step_id,
      stage_code:         s.stage_code,
      entity_type:        s.entity_type,
      entity_id:          s.entity_id,
      registration_id:    s.registration_id,
      title:              s.title,
      sla_due_at:         (s.sla_due_at as unknown as Date).toISOString(),
      hours_overdue:      s.hours_overdue,
      assigned_user_name: s.assigned_user_name,
    })),
  }
}

// ─── Export Data ──────────────────────────────────────────────────────────────

async function fetchExportRows(plantId: string, dataset: ExportDataset): Promise<Record<string, unknown>[]> {
  switch (dataset) {
    case 'ideas': {
      const res = await pool.query(
        `SELECT
           i.registration_id, i.title, i.status,
           TO_CHAR(i.submitted_at, 'YYYY-MM-DD') AS submitted_at,
           z.name AS zone, c.name AS category,
           u.full_name AS submitter
         FROM ideas i
         JOIN zones z       ON z.id = i.zone_id
         JOIN categories c  ON c.id = i.category_id
         JOIN users u       ON u.id = i.submitted_by
         WHERE i.plant_id = $1
         ORDER BY i.submitted_at DESC`,
        [plantId],
      )
      return res.rows as Record<string, unknown>[]
    }

    case 'kaizens': {
      const res = await pool.query(
        `SELECT
           k.kaizen_id, k.title, k.status,
           TO_CHAR(k.created_at, 'YYYY-MM-DD') AS created_at,
           TO_CHAR(k.one_pager_submitted_at, 'YYYY-MM-DD') AS submitted_at,
           z.name AS zone,
           u.full_name AS implementation_owner
         FROM kaizens k
         JOIN ideas i        ON i.id = k.idea_id
         JOIN zones z        ON z.id = i.zone_id
         LEFT JOIN users u   ON u.id = k.implementation_owner
         WHERE i.plant_id = $1
         ORDER BY k.created_at DESC`,
        [plantId],
      )
      return res.rows as Record<string, unknown>[]
    }

    case 'rewards': {
      const res = await pool.query(
        `SELECT
           k.kaizen_id, k.title,
           r.reward_type,
           r.reward_amount,
           r.reward_details,
           TO_CHAR(r.assigned_at, 'YYYY-MM-DD') AS assigned_at,
           z.name AS zone,
           u.full_name AS owner
         FROM rewards r
         JOIN kaizens k ON k.id = r.kaizen_id
         JOIN ideas i   ON i.id = k.idea_id
         JOIN zones z   ON z.id = i.zone_id
         LEFT JOIN users u ON u.id = k.implementation_owner
         WHERE i.plant_id = $1
         ORDER BY r.assigned_at DESC`,
        [plantId],
      )
      return res.rows as Record<string, unknown>[]
    }

    case 'leaderboard': {
      const res = await pool.query(
        `SELECT
           u.full_name                                      AS owner_name,
           z.name                                           AS zone,
           COUNT(DISTINCT k.id)::int                       AS total_kaizens,
           COUNT(DISTINCT r.id)::int                       AS total_rewards,
           COUNT(DISTINCT hin.id)::int                     AS high_impact_nominations
         FROM kaizens k
         JOIN ideas i   ON i.id = k.idea_id
         JOIN zones z   ON z.id = i.zone_id
         LEFT JOIN users u   ON u.id = k.implementation_owner
         LEFT JOIN rewards r ON r.kaizen_id = k.id
         LEFT JOIN high_impact_nominations hin ON hin.kaizen_id = k.id
         WHERE i.plant_id = $1
         GROUP BY k.implementation_owner, u.full_name, z.name
         ORDER BY total_kaizens DESC`,
        [plantId],
      )
      return res.rows as Record<string, unknown>[]
    }
  }
}

export async function exportCSV(plantId: string, dataset: ExportDataset): Promise<string> {
  const rows = await fetchExportRows(plantId, dataset)
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0]!)
  const escape = (v: unknown): string => {
    if (v == null) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ]
  return lines.join('\n')
}

export async function exportXLSX(plantId: string, dataset: ExportDataset): Promise<Buffer> {
  const rows = await fetchExportRows(plantId, dataset)
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, dataset)
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
