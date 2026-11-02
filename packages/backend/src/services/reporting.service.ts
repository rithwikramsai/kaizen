import { pool } from '../config/database.js'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(plantId: string): Promise<DashboardData> {
  const [ideasRes, kaizensRes, rewardsRes, slaRes] = await Promise.all([
    // ── Ideas ──
    pool.query<{
      total: number
      submitted: number
      under_review: number
      approved: number
      rejected: number
    }>(
      `SELECT
         COUNT(*)::int                                                      AS total,
         COUNT(*) FILTER (WHERE i.status = 'SUBMITTED')::int               AS submitted,
         COUNT(*) FILTER (
           WHERE i.status = 'SUBMITTED'
           AND EXISTS (
             SELECT 1 FROM workflow_instances wi2
             WHERE wi2.entity_type = 'idea'
               AND wi2.entity_id = i.id
               AND wi2.current_status NOT IN ('COMPLETED', 'REJECTED')
           )
         )::int                                                             AS under_review,
         COUNT(*) FILTER (WHERE i.status = 'APPROVED')::int                AS approved,
         COUNT(*) FILTER (WHERE i.status = 'REJECTED')::int                AS rejected
       FROM ideas i
       WHERE i.plant_id = $1`,
      [plantId],
    ),

    // ── Kaizens ──
    pool.query<{
      in_progress: number
      submitted: number
      approved: number
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE k.status = 'IN_PROGRESS')::int            AS in_progress,
         COUNT(*) FILTER (WHERE k.status = 'ONE_PAGER_SUBMITTED')::int    AS submitted,
         COUNT(*) FILTER (WHERE k.status = 'APPROVED')::int               AS approved
       FROM kaizens k
       JOIN ideas i ON i.id = k.idea_id
       WHERE i.plant_id = $1`,
      [plantId],
    ),

    // ── Rewards ──
    pool.query<{
      regular: number
      special: number
      high_impact: number
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE r.reward_type = 'REGULAR')::int   AS regular,
         COUNT(*) FILTER (WHERE r.reward_type = 'SPECIAL')::int   AS special,
         (
           SELECT COUNT(*)::int
           FROM high_impact_nominations hin
           JOIN kaizens k2 ON k2.id = hin.kaizen_id
           JOIN ideas i2   ON i2.id = k2.idea_id
           WHERE i2.plant_id = $1
         )                                                         AS high_impact
       FROM rewards r
       JOIN kaizens k ON k.id = r.kaizen_id
       JOIN ideas i   ON i.id = k.idea_id
       WHERE i.plant_id = $1`,
      [plantId],
    ),

    // ── SLA ──
    pool.query<{
      overdue: number
      due_today: number
      within_sla: number
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE ws.sla_due_at < NOW()              AND ws.status = 'PENDING')::int AS overdue,
         COUNT(*) FILTER (WHERE DATE(ws.sla_due_at) = CURRENT_DATE AND ws.status = 'PENDING')::int AS due_today,
         COUNT(*) FILTER (WHERE ws.status = 'PENDING'              AND ws.sla_due_at > NOW())::int  AS within_sla
       FROM workflow_steps ws
       WHERE ws.sla_due_at IS NOT NULL
         AND ws.workflow_instance_id IN (
           SELECT wi.id FROM workflow_instances wi
           WHERE
             (wi.entity_type = 'idea'   AND wi.entity_id IN (SELECT id FROM ideas WHERE plant_id = $1))
             OR
             (wi.entity_type = 'kaizen' AND wi.entity_id IN (
               SELECT k.id FROM kaizens k JOIN ideas i ON i.id = k.idea_id WHERE i.plant_id = $1
             ))
         )`,
      [plantId],
    ),
  ])

  const ideas   = ideasRes.rows[0]!
  const kaizens = kaizensRes.rows[0]!
  const rewards = rewardsRes.rows[0]!
  const sla     = slaRes.rows[0]!

  return {
    ideas: {
      total:        ideas.total,
      submitted:    ideas.submitted,
      under_review: ideas.under_review,
      approved:     ideas.approved,
      rejected:     ideas.rejected,
    },
    kaizens: {
      in_progress: kaizens.in_progress,
      submitted:   kaizens.submitted,
      approved:    kaizens.approved,
    },
    rewards: {
      regular:     rewards.regular,
      special:     rewards.special,
      high_impact: rewards.high_impact,
    },
    sla: {
      overdue:    sla.overdue,
      due_today:  sla.due_today,
      within_sla: sla.within_sla,
    },
  }
}
