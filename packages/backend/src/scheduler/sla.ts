import cron from 'node-cron'
import { pool } from '../config/database.js'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OverdueStep {
  id: string
  stage_code: string
  assigned_user_id: string | null
  workflow_instance_id: string
  entity_type: 'idea' | 'kaizen'
  entity_id: string
  initiated_by: string | null
  plant_id: string | null
  escalate_to_role: string | null
}

interface ApproachingStep {
  id: string
  stage_code: string
  assigned_user_id: string | null
  entity_type: 'idea' | 'kaizen'
  entity_id: string
  sla_due_at: Date
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function insertNotification(
  recipientId: string,
  type: string,
  title: string,
  body: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  if (!recipientId) return
  await pool.query(
    `INSERT INTO notifications (recipient_id, notification_type, title, body, entity_type, entity_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [recipientId, type, title, body, entityType, entityId],
  )
}

async function resolveRoleUser(roleName: string, plantId: string): Promise<string | null> {
  const res = await pool.query<{ user_id: string }>(
    `SELECT ur.user_id FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE r.name = $1 AND ur.plant_id = $2
     ORDER BY ur.granted_at ASC LIMIT 1`,
    [roleName, plantId],
  )
  return res.rows[0]?.user_id ?? null
}

// ─── Overdue escalation ───────────────────────────────────────────────────────

async function processOverdueSteps(): Promise<void> {
  const res = await pool.query<OverdueStep>(
    `SELECT
       ws.id,
       ws.stage_code,
       ws.assigned_user_id,
       ws.workflow_instance_id,
       wi.entity_type,
       wi.entity_id,
       wi.initiated_by,
       COALESCE(i.plant_id, ki.plant_id) AS plant_id,
       sc.escalate_to_role
     FROM workflow_steps ws
     JOIN workflow_instances wi ON wi.id = ws.workflow_instance_id
     LEFT JOIN ideas  i  ON wi.entity_type = 'idea'   AND wi.entity_id = i.id
     LEFT JOIN kaizens k  ON wi.entity_type = 'kaizen' AND wi.entity_id = k.id
     LEFT JOIN ideas  ki ON k.idea_id = ki.id
     LEFT JOIN sla_configs sc
       ON sc.plant_id = COALESCE(i.plant_id, ki.plant_id)
       AND sc.stage_code = ws.stage_code
       AND sc.workflow_type = wi.workflow_type
       AND sc.is_active = TRUE
     WHERE ws.status = 'PENDING'
       AND ws.sla_due_at IS NOT NULL
       AND ws.sla_due_at < NOW()
       AND ws.escalated = FALSE`,
  )

  if (res.rows.length === 0) return

  console.info(`[SLA] ${res.rows.length} overdue step(s) found — escalating`)

  for (const step of res.rows) {
    try {
      // Notify the assigned reviewer
      if (step.assigned_user_id) {
        await insertNotification(
          step.assigned_user_id,
          'SLA_ESCALATED',
          `Overdue: ${step.stage_code.replace(/_/g, ' ')}`,
          `This review step has passed its SLA deadline and requires immediate action.`,
          step.entity_type,
          step.entity_id,
        )
      }

      // Notify the escalation role (e.g., HOD or Plant OPEX)
      if (step.escalate_to_role && step.plant_id) {
        const escalationUserId = await resolveRoleUser(step.escalate_to_role, step.plant_id)
        if (escalationUserId && escalationUserId !== step.assigned_user_id) {
          await insertNotification(
            escalationUserId,
            'SLA_ESCALATED',
            `SLA Breach: ${step.stage_code.replace(/_/g, ' ')}`,
            `A review step assigned to your team has breached its SLA deadline.`,
            step.entity_type,
            step.entity_id,
          )
        }
      }

      // Also notify the submitter
      if (step.initiated_by) {
        await insertNotification(
          step.initiated_by,
          'SLA_ESCALATED',
          'Your submission has an overdue review step',
          `A review step (${step.stage_code.replace(/_/g, ' ')}) for your submission is overdue.`,
          step.entity_type,
          step.entity_id,
        )
      }

      // Mark escalated
      await pool.query(
        `UPDATE workflow_steps SET escalated = TRUE WHERE id = $1`,
        [step.id],
      )

      // Audit log
      await pool.query(
        `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
         VALUES (NULL, 'SLA_ESCALATED', $1, $2, $3, NOW())`,
        [step.entity_type, step.entity_id, JSON.stringify({ stage_code: step.stage_code })],
      )
    } catch (err) {
      console.error(`[SLA] Failed to escalate step ${step.id}:`, err)
    }
  }
}

// ─── Reminder notifications ───────────────────────────────────────────────────

async function processReminderSteps(): Promise<void> {
  const res = await pool.query<ApproachingStep>(
    `SELECT
       ws.id,
       ws.stage_code,
       ws.assigned_user_id,
       ws.sla_due_at,
       wi.entity_type,
       wi.entity_id
     FROM workflow_steps ws
     JOIN workflow_instances wi ON wi.id = ws.workflow_instance_id
     LEFT JOIN ideas  i  ON wi.entity_type = 'idea'   AND wi.entity_id = i.id
     LEFT JOIN kaizens k  ON wi.entity_type = 'kaizen' AND wi.entity_id = k.id
     LEFT JOIN ideas  ki ON k.idea_id = ki.id
     LEFT JOIN sla_configs sc
       ON sc.plant_id = COALESCE(i.plant_id, ki.plant_id)
       AND sc.stage_code = ws.stage_code
       AND sc.workflow_type = wi.workflow_type
       AND sc.is_active = TRUE
     WHERE ws.status = 'PENDING'
       AND ws.sla_due_at IS NOT NULL
       AND ws.sla_due_at > NOW()
       AND ws.escalated = FALSE
       AND sc.reminder_hrs IS NOT NULL
       AND ws.sla_due_at - NOW() < sc.reminder_hrs * INTERVAL '1 hour'`,
  )

  for (const step of res.rows) {
    if (!step.assigned_user_id) continue
    try {
      await insertNotification(
        step.assigned_user_id,
        'SLA_REMINDER_SENT',
        `Reminder: ${step.stage_code.replace(/_/g, ' ')} due soon`,
        `This review step is approaching its SLA deadline. Please take action.`,
        step.entity_type,
        step.entity_id,
      )

      await pool.query(
        `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
         VALUES (NULL, 'SLA_REMINDER_SENT', $1, $2, $3, NOW())`,
        [step.entity_type, step.entity_id, JSON.stringify({ stage_code: step.stage_code })],
      )
    } catch (err) {
      console.error(`[SLA] Failed to send reminder for step ${step.id}:`, err)
    }
  }
}

// ─── Scheduler entry point ────────────────────────────────────────────────────

export function startSlaScheduler(): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    void (async () => {
      try {
        await processReminderSteps()
        await processOverdueSteps()
      } catch (err) {
        console.error('[SLA] Scheduler error:', err)
      }
    })()
  })

  console.info('[SLA] Escalation scheduler started (runs every 15 minutes)')
}
