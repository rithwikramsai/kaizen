import type pg from 'pg'
import { pool } from '../config/database.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import { WorkflowEngine } from '../workflow/engine.js'
import { evaluateIdeaApprovalFlags, evaluateImplApprovalFlags } from '../workflow/flag-evaluator.js'
import { resolveReturnTarget } from '../workflow/return-router.js'
import type {
  InitiateParams,
  WorkflowInstanceRow,
  WorkflowStepRow,
  WorkflowFlagsRow,
  DynamicStepSpec,
} from '../workflow/types.js'
import type { WorkflowActionResult, WorkflowStatusResponse } from '@kiet/shared'

// ─── Initiate ────────────────────────────────────────────────────────────────

type InitiateResult = {
  instanceId: string
  currentStage: string
  currentStatus: string
  firstAssignee: { id: string; full_name: string } | null
}

// Inner implementation — caller owns the transaction and connection.
export async function initiateWorkflowWithClient(
  client: pg.PoolClient,
  params: InitiateParams,
): Promise<InitiateResult> {
  const engine = new WorkflowEngine(client)

  const { template, steps: templateSteps } = await engine.loadTemplate(params.workflowType)
  const baseSteps = templateSteps.filter((s) => !s.is_dynamic)

  const firstBaseStep = baseSteps[0]
  if (!firstBaseStep) throw new Error('Workflow template has no base steps')

  const instanceRes = await client.query<WorkflowInstanceRow>(
    `INSERT INTO workflow_instances
       (template_id, entity_type, entity_id, workflow_type, current_stage, current_status, initiated_by, initiated_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, NOW(), NOW(), NOW())
     RETURNING *`,
    [template.id, params.entityType, params.entityId, params.workflowType, firstBaseStep.stage_code, params.initiatedBy],
  )
  const instance = instanceRes.rows[0]!

  const inheritedFlags = params.inheritedFlags
  await client.query(
    `INSERT INTO workflow_flags
       (workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      instance.id,
      inheritedFlags?.machine_design_change ?? false,
      inheritedFlags?.safety_review_required ?? false,
      inheritedFlags?.qms_review_required ?? false,
      inheritedFlags?.sci_tech_required ?? false,
    ],
  )

  const insertedSteps: WorkflowStepRow[] = []
  for (const tStep of baseSteps) {
    const roleName = roleNameForStage(tStep.stage_code, tStep.assigned_role)
    const assignedUserId = await engine.resolveAssigneeByRole(roleName, params.plantId)
    const step = await engine.insertStep({
      workflowInstanceId: instance.id,
      stepOrder: tStep.step_order,
      stageCode: tStep.stage_code,
      assignedUserId: assignedUserId ?? '',
      isDynamic: false,
      slaHours: tStep.sla_hours,
      plantId: params.plantId,
      workflowType: params.workflowType,
    })

    if (assignedUserId && assignedUserId === params.submitterId) {
      await client.query(
        `UPDATE workflow_steps SET status = 'SKIPPED', action_taken_at = NOW() WHERE id = $1`,
        [step.id],
      )
      insertedSteps.push({ ...step, status: 'SKIPPED' })
    } else {
      insertedSteps.push(step)
    }
  }

  if (inheritedFlags) {
    const specs = evaluateImplApprovalFlags(inheritedFlags)
    if (specs.length > 0) {
      await engine.insertDynamicSteps(instance.id, params.plantId, params.workflowType, specs)
    }
  }

  const allCurrentSteps = await client.query<WorkflowStepRow>(
    `SELECT * FROM workflow_steps WHERE workflow_instance_id = $1 ORDER BY step_order ASC`,
    [instance.id],
  )
  const firstActive = allCurrentSteps.rows.find((s) => s.status !== 'SKIPPED')
  if (!firstActive) throw new Error('All steps were auto-skipped — no active step found')

  const tStepForFirst = templateSteps.find((t) => t.stage_code === firstActive.stage_code)
  await engine.activateStep(
    firstActive.id,
    params.plantId,
    params.workflowType,
    firstActive.stage_code,
    tStepForFirst?.sla_hours ?? null,
  )

  await client.query(
    `UPDATE workflow_instances SET current_stage = $1, updated_at = NOW() WHERE id = $2`,
    [firstActive.stage_code, instance.id],
  )

  let firstAssignee: { id: string; full_name: string } | null = null
  if (firstActive.assigned_user_id) {
    const uRes = await client.query<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM users WHERE id = $1`,
      [firstActive.assigned_user_id],
    )
    firstAssignee = uRes.rows[0] ?? null
  }

  return { instanceId: instance.id, currentStage: firstActive.stage_code, currentStatus: 'PENDING', firstAssignee }
}

// Public wrapper — owns its own connection and transaction.
export async function initiateWorkflow(params: InitiateParams): Promise<InitiateResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await initiateWorkflowWithClient(client, params)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Process Action ───────────────────────────────────────────────────────────

export async function processWorkflowAction(params: {
  entityType: 'idea' | 'kaizen'
  entityId: string
  actorId: string
  action: string
  comment?: string
  flags?: Partial<{
    machine_design_change: boolean
    safety_review_required: boolean
    qms_review_required: boolean
  }>
  sciTechFlag?: boolean
}): Promise<WorkflowActionResult> {
  if ((params.action === 'RETURN' || params.action === 'REJECT') && !params.comment?.trim()) {
    throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Comment is required for RETURN and REJECT actions')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const engine = new WorkflowEngine(client)

    // Load instance
    const instRes = await client.query<WorkflowInstanceRow>(
      `SELECT * FROM workflow_instances
       WHERE entity_type = $1 AND entity_id = $2
         AND current_status NOT IN ('COMPLETED', 'REJECTED')
       LIMIT 1`,
      [params.entityType, params.entityId],
    )
    const instance = instRes.rows[0]
    if (!instance) {
      throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'No active workflow found for this entity')
    }

    // Load active step
    const stepRes = await client.query<WorkflowStepRow>(
      `SELECT * FROM workflow_steps
       WHERE workflow_instance_id = $1 AND status = 'PENDING'
       ORDER BY step_order ASC LIMIT 1`,
      [instance.id],
    )
    const currentStep = stepRes.rows[0]
    if (!currentStep) {
      throw new ServiceError(422, ErrorCodes.WORKFLOW_ERROR, 'No pending step found for this workflow')
    }

    // Validate actor is the assignee
    if (currentStep.assigned_user_id !== params.actorId) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'You are not the assigned approver for this step')
    }

    const previousStage = instance.current_stage
    let nextStage = previousStage
    let nextStatus = 'PENDING'
    let nextAssignee: { id: string; full_name: string } | null = null

    // ── APPROVE ──────────────────────────────────────────────────────────────
    if (params.action === 'APPROVE') {
      await client.query(
        `UPDATE workflow_steps SET status = 'APPROVED', action_taken_at = NOW(), comment = $1 WHERE id = $2`,
        [params.comment ?? null, currentStep.id],
      )

      // Update flags if HOD provides them
      if (params.flags && currentStep.stage_code === 'HOD_REVIEW') {
        await client.query(
          `UPDATE workflow_flags
           SET machine_design_change = $1, safety_review_required = $2, qms_review_required = $3,
               set_by_user_id = $4, set_at = NOW()
           WHERE workflow_instance_id = $5`,
          [
            params.flags.machine_design_change ?? false,
            params.flags.safety_review_required ?? false,
            params.flags.qms_review_required ?? false,
            params.actorId,
            instance.id,
          ],
        )

        // Insert dynamic steps based on flags
        const wfType = instance.workflow_type
        let specs: DynamicStepSpec[] = []
        if (wfType === 'IDEA_APPROVAL') {
          specs = evaluateIdeaApprovalFlags({
            safety_review_required: params.flags.safety_review_required ?? false,
            qms_review_required: params.flags.qms_review_required ?? false,
            machine_design_change: params.flags.machine_design_change ?? false,
          })
        } else {
          // For IMPL_APPROVAL, re-evaluate with current flags (they may already be inherited)
          const flagsRow = await client.query<WorkflowFlagsRow>(
            `SELECT * FROM workflow_flags WHERE workflow_instance_id = $1`,
            [instance.id],
          )
          const f = flagsRow.rows[0]
          if (f) {
            specs = evaluateImplApprovalFlags({
              machine_design_change: f.machine_design_change,
              safety_review_required: f.safety_review_required,
              qms_review_required: f.qms_review_required,
              sci_tech_required: f.sci_tech_required,
            })
            // Filter out already-existing steps
            const existingRes = await client.query<{ stage_code: string }>(
              `SELECT stage_code FROM workflow_steps WHERE workflow_instance_id = $1`,
              [instance.id],
            )
            const existing = new Set(existingRes.rows.map((r) => r.stage_code))
            specs = specs.filter((s) => !existing.has(s.stage_code))
          }
        }

        if (specs.length > 0) {
          await engine.insertDynamicSteps(instance.id, getPlantIdFromInstance(instance), instance.workflow_type, specs)
        }
      }

      // Update sci_tech_required if SME sets it
      if (params.sciTechFlag && currentStep.stage_code === 'SME_REVIEW') {
        await client.query(
          `UPDATE workflow_flags SET sci_tech_required = TRUE, set_by_user_id = $1, set_at = NOW()
           WHERE workflow_instance_id = $2`,
          [params.actorId, instance.id],
        )
        // Insert SCI_TECH_UPLOAD step if not already there
        const existingRes = await client.query<{ stage_code: string }>(
          `SELECT stage_code FROM workflow_steps WHERE workflow_instance_id = $1`,
          [instance.id],
        )
        const existing = new Set(existingRes.rows.map((r) => r.stage_code))
        if (!existing.has('SCI_TECH_UPLOAD')) {
          const maxOrderRes = await client.query<{ max_order: number }>(
            `SELECT MAX(step_order) as max_order FROM workflow_steps WHERE workflow_instance_id = $1`,
            [instance.id],
          )
          const maxOrder = (maxOrderRes.rows[0]?.max_order ?? currentStep.step_order) + 1
          const plantId = await resolveInstancePlantId(client, instance.id)
          const hodUserId = await engine.resolveAssigneeByRole('HOD', plantId)
          await engine.insertStep({
            workflowInstanceId: instance.id,
            stepOrder: maxOrder,
            stageCode: 'SCI_TECH_UPLOAD',
            assignedUserId: hodUserId ?? '',
            isDynamic: true,
            slaHours: 120,
            plantId,
            workflowType: instance.workflow_type,
          })
        }
      }

      // Load next PENDING step
      const nextStepRes = await client.query<WorkflowStepRow>(
        `SELECT * FROM workflow_steps
         WHERE workflow_instance_id = $1 AND status = 'PENDING' AND step_order > $2
         ORDER BY step_order ASC LIMIT 1`,
        [instance.id, currentStep.step_order],
      )
      const nextStep = nextStepRes.rows[0]

      if (!nextStep) {
        // Terminal success
        const terminalStage =
          instance.workflow_type === 'IDEA_APPROVAL' ? 'IDEA_APPROVED' : 'KAIZEN_APPROVED'
        nextStage = terminalStage
        nextStatus = 'COMPLETED'
        await client.query(
          `UPDATE workflow_instances SET current_stage = $1, current_status = 'COMPLETED', completed_at = NOW(), updated_at = NOW() WHERE id = $2`,
          [terminalStage, instance.id],
        )
        await syncEntityStatus(client, instance.entity_type, instance.entity_id, 'APPROVED')

        // Notify submitter
        await engine.createNotification({
          recipientId: instance.initiated_by,
          type: instance.workflow_type === 'IDEA_APPROVAL' ? 'IDEA_APPROVED' : 'KAIZEN_APPROVED',
          title: instance.workflow_type === 'IDEA_APPROVAL' ? 'Your idea has been approved' : 'Your kaizen has been approved',
          body: 'Congratulations! Your submission has passed all review steps.',
          entityType: instance.entity_type,
          entityId: instance.entity_id,
        })
        // Notify plant_opex users
        const opexUsers = await client.query<{ user_id: string }>(
          `SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'Plant OPEX'`,
        )
        for (const opex of opexUsers.rows) {
          await engine.createNotification({
            recipientId: opex.user_id,
            type: instance.workflow_type === 'IDEA_APPROVAL' ? 'IDEA_APPROVED' : 'KAIZEN_APPROVED',
            title: 'A submission has been approved',
            body: 'A new submission has completed the approval workflow.',
            entityType: instance.entity_type,
            entityId: instance.entity_id,
          })
        }

        await engine.createAuditLog({
          performedBy: params.actorId,
          action: instance.workflow_type === 'IDEA_APPROVAL' ? 'STEP_APPROVED' : 'KAIZEN_APPROVED',
          entityType: instance.entity_type,
          entityId: instance.entity_id,
          payload: { stage: currentStep.stage_code, terminal: true },
        })
      } else {
        // Activate next step
        nextStage = nextStep.stage_code
        nextStatus = 'PENDING'
        const plantId = await resolveInstancePlantId(client, instance.id)
        await engine.activateStep(nextStep.id, plantId, instance.workflow_type, nextStep.stage_code, null)
        await client.query(
          `UPDATE workflow_instances SET current_stage = $1, current_status = 'PENDING', updated_at = NOW() WHERE id = $2`,
          [nextStep.stage_code, instance.id],
        )
        // Notify next assignee
        if (nextStep.assigned_user_id) {
          const uRes = await client.query<{ id: string; full_name: string }>(
            `SELECT id, full_name FROM users WHERE id = $1`,
            [nextStep.assigned_user_id],
          )
          nextAssignee = uRes.rows[0] ?? null
          await engine.createNotification({
            recipientId: nextStep.assigned_user_id,
            type: 'STEP_ASSIGNED',
            title: 'A workflow step has been assigned to you',
            body: `You have a pending ${nextStep.stage_code} step to review.`,
            entityType: instance.entity_type,
            entityId: instance.entity_id,
          })
        }

        await engine.createAuditLog({
          performedBy: params.actorId,
          action: 'STEP_APPROVED',
          entityType: instance.entity_type,
          entityId: instance.entity_id,
          payload: { stage: currentStep.stage_code, next_stage: nextStep.stage_code },
        })
      }
    }

    // ── RETURN ───────────────────────────────────────────────────────────────
    else if (params.action === 'RETURN') {
      await client.query(
        `UPDATE workflow_steps SET status = 'RETURNED', action_taken_at = NOW(), comment = $1 WHERE id = $2`,
        [params.comment!, currentStep.id],
      )

      const allStepsRes = await client.query<WorkflowStepRow>(
        `SELECT * FROM workflow_steps WHERE workflow_instance_id = $1 ORDER BY step_order ASC`,
        [instance.id],
      )
      const target = resolveReturnTarget(allStepsRes.rows, currentStep.step_order)

      if (!target) {
        nextStatus = 'RETURNED'
        await client.query(
          `UPDATE workflow_instances SET current_status = 'RETURNED', updated_at = NOW() WHERE id = $1`,
          [instance.id],
        )
        // Notify submitter
        await engine.createNotification({
          recipientId: instance.initiated_by,
          type: 'STEP_RETURNED',
          title: 'Your submission has been returned for revision',
          body: params.comment!,
          entityType: instance.entity_type,
          entityId: instance.entity_id,
        })
      } else {
        nextStage = target.stage_code
        nextStatus = 'RETURNED'
        // Reactivate target step
        await client.query(
          `UPDATE workflow_steps SET status = 'PENDING', action_taken_at = NULL, comment = NULL WHERE id = $1`,
          [target.id],
        )
        const plantId = await resolveInstancePlantId(client, instance.id)
        await engine.activateStep(target.id, plantId, instance.workflow_type, target.stage_code, null)
        await client.query(
          `UPDATE workflow_instances SET current_stage = $1, current_status = 'RETURNED', updated_at = NOW() WHERE id = $2`,
          [target.stage_code, instance.id],
        )
        if (target.assigned_user_id) {
          const uRes = await client.query<{ id: string; full_name: string }>(
            `SELECT id, full_name FROM users WHERE id = $1`,
            [target.assigned_user_id],
          )
          nextAssignee = uRes.rows[0] ?? null
          await engine.createNotification({
            recipientId: target.assigned_user_id,
            type: 'STEP_RETURNED',
            title: 'A step has been returned to you',
            body: params.comment!,
            entityType: instance.entity_type,
            entityId: instance.entity_id,
          })
        }
      }

      await engine.createAuditLog({
        performedBy: params.actorId,
        action: 'STEP_RETURNED',
        entityType: instance.entity_type,
        entityId: instance.entity_id,
        payload: { stage: currentStep.stage_code, comment: params.comment },
      })
    }

    // ── REJECT ───────────────────────────────────────────────────────────────
    else if (params.action === 'REJECT') {
      await client.query(
        `UPDATE workflow_steps SET status = 'REJECTED', action_taken_at = NOW(), comment = $1 WHERE id = $2`,
        [params.comment!, currentStep.id],
      )

      const terminalStage =
        instance.workflow_type === 'IDEA_APPROVAL' ? 'IDEA_REJECTED' : 'KAIZEN_REJECTED'
      nextStage = terminalStage
      nextStatus = 'REJECTED'

      await client.query(
        `UPDATE workflow_instances SET current_stage = $1, current_status = 'REJECTED', completed_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [terminalStage, instance.id],
      )
      await syncEntityStatus(client, instance.entity_type, instance.entity_id, 'REJECTED')

      await engine.createNotification({
        recipientId: instance.initiated_by,
        type: 'STEP_RETURNED',
        title: 'Your submission has been rejected',
        body: params.comment!,
        entityType: instance.entity_type,
        entityId: instance.entity_id,
      })

      await engine.createAuditLog({
        performedBy: params.actorId,
        action: 'STEP_REJECTED',
        entityType: instance.entity_type,
        entityId: instance.entity_id,
        payload: { stage: currentStep.stage_code, comment: params.comment },
      })
    } else {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, `Unknown action: ${params.action}`)
    }

    await client.query('COMMIT')

    return {
      workflow_instance_id: instance.id,
      previous_stage: previousStage,
      current_stage: nextStage,
      current_status: nextStatus as 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'RETURNED' | 'REJECTED' | 'COMPLETED',
      next_assignee: nextAssignee,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Get Status ───────────────────────────────────────────────────────────────

export async function getWorkflowStatus(
  entityType: 'idea' | 'kaizen',
  entityId: string,
): Promise<WorkflowStatusResponse> {
  const instRes = await pool.query<WorkflowInstanceRow>(
    `SELECT * FROM workflow_instances WHERE entity_type = $1 AND entity_id = $2
     ORDER BY initiated_at DESC LIMIT 1`,
    [entityType, entityId],
  )
  const instance = instRes.rows[0]
  if (!instance) {
    throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'No workflow found for this entity')
  }

  const stepsRes = await pool.query<
    WorkflowStepRow & { full_name: string }
  >(
    `SELECT ws.*, u.full_name
     FROM workflow_steps ws
     LEFT JOIN users u ON u.id = ws.assigned_user_id
     WHERE ws.workflow_instance_id = $1
     ORDER BY ws.step_order ASC`,
    [instance.id],
  )

  return {
    workflow_instance_id: instance.id,
    workflow_type: instance.workflow_type as 'IDEA_APPROVAL' | 'IMPLEMENTATION_APPROVAL',
    current_stage: instance.current_stage,
    current_status: instance.current_status as 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'RETURNED' | 'REJECTED' | 'COMPLETED',
    steps: stepsRes.rows.map((s) => ({
      step_order: s.step_order,
      stage_code: s.stage_code,
      status: s.status as 'PENDING' | 'APPROVED' | 'RETURNED' | 'REJECTED' | 'SKIPPED',
      assigned_to: { id: s.assigned_user_id, full_name: s.full_name ?? '' },
      action_taken_at: s.action_taken_at ? s.action_taken_at.toISOString() : null,
      sla_due_at: s.sla_due_at ? s.sla_due_at.toISOString() : null,
    })),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roleNameForStage(stageCode: string, assignedRole: string): string {
  // The assigned_role in workflow_template_steps is the role code (e.g. 'zone_leader')
  // Map to DB role names used in roles table
  const map: Record<string, string> = {
    zone_leader: 'Zone Leader',
    hod: 'HOD',
    plant_safety: 'Plant Safety',
    plant_quality: 'Plant Quality',
    sme: 'SME',
  }
  return map[assignedRole] ?? assignedRole
}

async function resolveInstancePlantId(client: pg.PoolClient, instanceId: string): Promise<string> {
  // Get plant_id from the entity linked to the workflow instance
  const res = await client.query<{ entity_type: string; entity_id: string }>(
    `SELECT entity_type, entity_id FROM workflow_instances WHERE id = $1`,
    [instanceId],
  )
  const row = res.rows[0]
  if (!row) return ''

  if (row.entity_type === 'idea') {
    const ideaRes = await client.query<{ plant_id: string }>(
      `SELECT plant_id FROM ideas WHERE id = $1`,
      [row.entity_id],
    )
    return ideaRes.rows[0]?.plant_id ?? ''
  } else {
    const kaizenRes = await client.query<{ plant_id: string }>(
      `SELECT i.plant_id FROM kaizens k JOIN ideas i ON i.id = k.idea_id WHERE k.id = $1`,
      [row.entity_id],
    )
    return kaizenRes.rows[0]?.plant_id ?? ''
  }
}

function getPlantIdFromInstance(instance: WorkflowInstanceRow): string {
  // Placeholder — in processWorkflowAction we always call resolveInstancePlantId
  void instance
  return ''
}

async function syncEntityStatus(
  client: pg.PoolClient,
  entityType: 'idea' | 'kaizen',
  entityId: string,
  outcome: 'APPROVED' | 'REJECTED',
): Promise<void> {
  if (entityType === 'idea') {
    await client.query(
      `UPDATE ideas SET status = $1, updated_at = NOW() WHERE id = $2`,
      [outcome, entityId],
    )
  } else {
    await client.query(
      `UPDATE kaizens SET status = $1, updated_at = NOW() WHERE id = $2`,
      [outcome, entityId],
    )
  }
}
