import { pool } from '../config/database.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import { generateKaizenId } from '../utils/id-generator.js'
import { initiateWorkflowWithClient } from './workflow.service.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KaizenRow {
  id: string
  kaizen_id: string | null
  idea_id: string
  implementation_owner: string | null
  assigned_by: string | null
  title: string
  before_description: string | null
  after_description: string | null
  benefits_achieved: string | null
  cost_savings: number | null
  team_members: string | null
  business_impact: string | null
  w1h_who: string | null
  w1h_what: string | null
  w1h_where: string | null
  w1h_when: string | null
  w1h_why: string | null
  w1h_how: string | null
  why_1: string | null
  why_2: string | null
  why_3: string | null
  why_4: string | null
  why_5: string | null
  root_cause_analysis: string | null
  category_of_cause: string | null
  solution_implemented: string | null
  results: string | null
  cost: number | null
  benefit: number | null
  early_equipment_mgmt: boolean
  applicable_documents: string | null
  remarks: string | null
  status: string
  one_pager_submitted_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface SaveDraftParams {
  title?: string
  team_members?: string
  business_impact?: string
  before_description?: string
  w1h_who?: string
  w1h_what?: string
  w1h_where?: string
  w1h_when?: string
  w1h_why?: string
  w1h_how?: string
  why_1?: string
  why_2?: string
  why_3?: string
  why_4?: string
  why_5?: string
  root_cause_analysis?: string
  category_of_cause?: string
  solution_implemented?: string
  results?: string
  after_description?: string
  cost?: number | null
  benefit?: number | null
  early_equipment_mgmt?: boolean
  applicable_documents?: string
  remarks?: string
  before_file_ids?: string[]
  after_file_ids?: string[]
  supporting_file_ids?: string[]
}

// ─── Approved Ideas Queue ─────────────────────────────────────────────────────

export async function getApprovedIdeasQueue(actorId: string, plantId: string): Promise<unknown[]> {
  // Resolve actor's zone assignment: Zone Leaders have a zone_id in user_roles;
  // plant-wide roles (HOD, Plant OPEX, Admin) do not.
  const zoneRes = await pool.query<{ zone_id: string | null }>(
    `SELECT ur.zone_id
     FROM user_roles ur
     WHERE ur.user_id = $1 AND ur.plant_id = $2
     ORDER BY ur.granted_at ASC
     LIMIT 1`,
    [actorId, plantId],
  )
  const actorZoneId = zoneRes.rows[0]?.zone_id ?? null

  const rows = await pool.query(
    `SELECT
       i.id, i.registration_id, i.title, i.submitted_at, i.zone_id,
       u.id AS submitter_id, u.full_name AS submitter_name,
       z.name AS zone_name,
       d.name AS department_name,
       k.id AS kaizen_id_uuid, k.kaizen_id, k.status AS kaizen_status,
       k.implementation_owner
     FROM ideas i
     JOIN users u  ON u.id  = i.submitted_by
     JOIN zones z  ON z.id  = i.zone_id
     LEFT JOIN departments d ON d.id = i.department_id
     LEFT JOIN kaizens k ON k.idea_id = i.id
     WHERE i.status = 'APPROVED'
       AND i.plant_id = $1
       AND ($2::uuid IS NULL OR i.zone_id = $2::uuid)
     ORDER BY i.submitted_at DESC`,
    [plantId, actorZoneId],
  )

  return rows.rows.map((r) => ({
    id: r.id as string,
    registration_id: r.registration_id as string,
    title: r.title as string,
    submitted_at: r.submitted_at ? (r.submitted_at as Date).toISOString() : null,
    submitted_by: { id: r.submitter_id as string, full_name: r.submitter_name as string },
    zone: { name: r.zone_name as string },
    department: r.department_name ? { name: r.department_name as string } : null,
    kaizen: r.kaizen_id_uuid
      ? {
          id: r.kaizen_id_uuid as string,
          kaizen_id: r.kaizen_id as string | null,
          status: r.kaizen_status as string,
          implementation_owner: r.implementation_owner as string | null,
        }
      : null,
  }))
}

// ─── Mark Implemented ─────────────────────────────────────────────────────────

export async function markImplemented(
  ideaId: string,
  actorId: string,
): Promise<{ kaizen_uuid: string; kaizen_id: string }> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verify idea is APPROVED
    const ideaRes = await client.query<{
      id: string; title: string; submitted_by: string; plant_id: string; zone_id: string
    }>(
      `SELECT id, title, submitted_by, plant_id, zone_id FROM ideas WHERE id = $1 AND status = 'APPROVED'`,
      [ideaId],
    )
    const idea = ideaRes.rows[0]
    if (!idea) {
      throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Approved idea not found')
    }

    // Guard: only one kaizen per idea
    const existingKaizen = await client.query<{ id: string }>(
      `SELECT id FROM kaizens WHERE idea_id = $1`,
      [ideaId],
    )
    if (existingKaizen.rows[0]) {
      throw new ServiceError(409, ErrorCodes.CONFLICT, 'This idea has already been marked as implemented')
    }

    // Determine implementation owner via submitter's primary role
    const roleRes = await client.query<{ name: string }>(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY ur.granted_at ASC
       LIMIT 1`,
      [idea.submitted_by],
    )
    const submitterRole = roleRes.rows[0]?.name ?? ''

    let implementationOwner: string | null = null

    if (submitterRole === 'Management Associate') {
      // Implementation owner = the idea owner themselves
      implementationOwner = idea.submitted_by
    } else if (submitterRole === 'Plant Associate') {
      // Implementation owner = Zone Leader for that zone
      const zlRes = await client.query<{ user_id: string }>(
        `SELECT ur.user_id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name = 'Zone Leader'
           AND ur.plant_id = $1
           AND (ur.zone_id = $2 OR ur.zone_id IS NULL)
         ORDER BY (ur.zone_id = $2) DESC, ur.granted_at ASC
         LIMIT 1`,
        [idea.plant_id, idea.zone_id],
      )
      implementationOwner = zlRes.rows[0]?.user_id ?? null
    }
    // All other roles: leave null, Plant OPEX can manually assign via CAN_ASSIGN_IMPL_OWNER

    const kaizenId = await generateKaizenId('')

    const kaizenRes = await client.query<KaizenRow>(
      `INSERT INTO kaizens
         (kaizen_id, idea_id, implementation_owner, assigned_by, title, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'IN_PROGRESS', NOW(), NOW())
       RETURNING *`,
      [kaizenId, ideaId, implementationOwner, actorId, idea.title],
    )
    const kaizen = kaizenRes.rows[0]!

    // Audit log (immutable)
    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
       VALUES ($1, 'MARK_IMPLEMENTED', 'idea', $2, $3, NOW())`,
      [
        actorId,
        ideaId,
        JSON.stringify({
          kaizen_id: kaizenId,
          kaizen_uuid: kaizen.id,
          implementation_owner: implementationOwner,
          auto_assigned_role: submitterRole,
        }),
      ],
    )

    await client.query('COMMIT')
    return { kaizen_uuid: kaizen.id, kaizen_id: kaizenId }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ─── Get Kaizen ───────────────────────────────────────────────────────────────

export async function getKaizen(kaizenId: string, actorId: string): Promise<unknown> {
  const res = await pool.query(
    `SELECT
       k.*,
       i.registration_id      AS idea_reg_id,
       i.problem_statement    AS idea_problem_statement,
       i.description          AS idea_description,
       i.plant_id,
       i.zone_id              AS idea_zone_id,
       u_owner.id             AS owner_id,
       u_owner.full_name      AS owner_name,
       u_owner.employee_id    AS owner_emp_id,
       z.name                 AS zone_name,
       d.name                 AS department_name
     FROM kaizens k
     JOIN ideas i         ON i.id = k.idea_id
     LEFT JOIN users u_owner ON u_owner.id = k.implementation_owner
     LEFT JOIN zones z    ON z.id = i.zone_id
     LEFT JOIN departments d ON d.id = i.department_id
     WHERE k.id = $1`,
    [kaizenId],
  )
  const row = res.rows[0]
  if (!row) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Kaizen not found')

  // Enforce plant-level isolation: resolve actor's primary plant and compare against idea's plant
  const actorPlantRes = await pool.query<{ plant_id: string }>(
    `SELECT plant_id FROM user_roles WHERE user_id = $1 AND plant_id IS NOT NULL ORDER BY granted_at ASC LIMIT 1`,
    [actorId],
  )
  const actorPlantId = actorPlantRes.rows[0]?.plant_id
  if (actorPlantId && row.plant_id && actorPlantId !== row.plant_id) {
    throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Access denied: cross-plant access not permitted')
  }

  // Attachments
  const attRes = await pool.query(
    `SELECT ka.id, ka.attachment_type, fm.id AS file_id, fm.file_name, fm.content_type, fm.file_size
     FROM kaizen_attachments ka
     JOIN file_metadata fm ON fm.id = ka.file_id
     WHERE ka.kaizen_id = $1`,
    [kaizenId],
  )

  const r = row
  const costBenefitRatio =
    r.cost && r.benefit && Number(r.cost) > 0
      ? Math.round((Number(r.benefit) / Number(r.cost)) * 100) / 100
      : null

  return {
    id: r.id as string,
    kaizen_id: r.kaizen_id as string | null,
    status: r.status as string,
    title: r.title as string,
    implementation_owner: r.owner_id
      ? { id: r.owner_id as string, full_name: r.owner_name as string, employee_id: r.owner_emp_id as string }
      : null,
    idea: {
      id: r.idea_id as string,
      registration_id: r.idea_reg_id as string,
      problem_statement: r.idea_problem_statement as string,
      description: r.idea_description as string,
    },
    zone: { name: r.zone_name as string | null },
    department: r.department_name ? { name: r.department_name as string } : null,
    // One Pager fields
    team_members: r.team_members as string | null,
    business_impact: r.business_impact as string | null,
    before_description: r.before_description as string | null,
    w1h: {
      who: r.w1h_who as string | null,
      what: r.w1h_what as string | null,
      where: r.w1h_where as string | null,
      when: r.w1h_when as string | null,
      why: r.w1h_why as string | null,
      how: r.w1h_how as string | null,
    },
    five_why: {
      why_1: r.why_1 as string | null,
      why_2: r.why_2 as string | null,
      why_3: r.why_3 as string | null,
      why_4: r.why_4 as string | null,
      why_5: r.why_5 as string | null,
    },
    root_cause_analysis: r.root_cause_analysis as string | null,
    category_of_cause: r.category_of_cause as string | null,
    solution_implemented: r.solution_implemented as string | null,
    results: r.results as string | null,
    after_description: r.after_description as string | null,
    cost: r.cost != null ? Number(r.cost) : null,
    benefit: r.benefit != null ? Number(r.benefit) : null,
    cost_benefit_ratio: costBenefitRatio,
    cost_savings: r.cost_savings != null ? Number(r.cost_savings) : null,
    early_equipment_mgmt: r.early_equipment_mgmt as boolean,
    applicable_documents: r.applicable_documents as string | null,
    remarks: r.remarks as string | null,
    one_pager_submitted_at: r.one_pager_submitted_at
      ? (r.one_pager_submitted_at as Date).toISOString()
      : null,
    attachments: attRes.rows.map((a) => ({
      id: a.id as string,
      file_id: a.file_id as string,
      file_name: a.file_name as string,
      content_type: a.content_type as string,
      file_size: a.file_size as number,
      attachment_type: a.attachment_type as string,
    })),
    created_at: (r.created_at as Date).toISOString(),
    updated_at: (r.updated_at as Date).toISOString(),
  }
}

// ─── Save Draft ───────────────────────────────────────────────────────────────

export async function saveKaizenDraft(
  kaizenId: string,
  actorId: string,
  params: SaveDraftParams,
): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verify exists and is editable
    const check = await client.query<{ id: string; status: string; implementation_owner: string | null }>(
      `SELECT id, status, implementation_owner FROM kaizens WHERE id = $1`,
      [kaizenId],
    )
    const k = check.rows[0]
    if (!k) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Kaizen not found')
    if (!['IN_PROGRESS', 'PENDING'].includes(k.status)) {
      throw new ServiceError(409, ErrorCodes.CONFLICT, 'One Pager has already been submitted')
    }

    // Enforce plant-level isolation
    const kaizenPlantRes = await client.query<{ plant_id: string }>(
      `SELECT i.plant_id FROM kaizens kz JOIN ideas i ON i.id = kz.idea_id WHERE kz.id = $1`,
      [kaizenId],
    )
    const kaizenPlantId = kaizenPlantRes.rows[0]?.plant_id
    const actorPlantRes = await client.query<{ plant_id: string }>(
      `SELECT plant_id FROM user_roles WHERE user_id = $1 AND plant_id IS NOT NULL ORDER BY granted_at ASC LIMIT 1`,
      [actorId],
    )
    const actorPlantId = actorPlantRes.rows[0]?.plant_id
    if (actorPlantId && kaizenPlantId && actorPlantId !== kaizenPlantId) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Access denied: cross-plant access not permitted')
    }

    // Null-safe helper
    const orNull = (v: string | undefined) => (v !== undefined && v !== '' ? v : null)

    await client.query(
      `UPDATE kaizens SET
         title                 = COALESCE($1, title),
         team_members          = $2,
         business_impact       = $3,
         before_description    = $4,
         w1h_who               = $5,
         w1h_what              = $6,
         w1h_where             = $7,
         w1h_when              = $8,
         w1h_why               = $9,
         w1h_how               = $10,
         why_1                 = $11,
         why_2                 = $12,
         why_3                 = $13,
         why_4                 = $14,
         why_5                 = $15,
         root_cause_analysis   = $16,
         category_of_cause     = $17,
         solution_implemented  = $18,
         results               = $19,
         after_description     = $20,
         cost                  = $21,
         benefit               = $22,
         early_equipment_mgmt  = COALESCE($23, early_equipment_mgmt),
         applicable_documents  = $24,
         remarks               = $25,
         updated_at            = NOW()
       WHERE id = $26`,
      [
        orNull(params.title),
        orNull(params.team_members),
        orNull(params.business_impact),
        orNull(params.before_description),
        orNull(params.w1h_who),
        orNull(params.w1h_what),
        orNull(params.w1h_where),
        orNull(params.w1h_when),
        orNull(params.w1h_why),
        orNull(params.w1h_how),
        orNull(params.why_1),
        orNull(params.why_2),
        orNull(params.why_3),
        orNull(params.why_4),
        orNull(params.why_5),
        orNull(params.root_cause_analysis),
        orNull(params.category_of_cause),
        orNull(params.solution_implemented),
        orNull(params.results),
        orNull(params.after_description),
        params.cost ?? null,
        params.benefit ?? null,
        params.early_equipment_mgmt ?? null,
        orNull(params.applicable_documents),
        orNull(params.remarks),
        kaizenId,
      ],
    )

    // Sync attachments: undefined = caller did not touch this type (skip).
    // An empty array = caller cleared all files of this type (delete existing, insert nothing).
    const syncAttachments = async (fileIds: string[] | undefined, type: string) => {
      if (fileIds === undefined) return
      await client.query(
        `DELETE FROM kaizen_attachments WHERE kaizen_id = $1 AND attachment_type = $2`,
        [kaizenId, type],
      )
      for (const fileId of fileIds) {
        await client.query(
          `INSERT INTO kaizen_attachments (kaizen_id, file_id, attachment_type) VALUES ($1, $2, $3)`,
          [kaizenId, fileId, type],
        )
      }
    }

    await syncAttachments(params.before_file_ids, 'BEFORE_PHOTO')
    await syncAttachments(params.after_file_ids, 'AFTER_PHOTO')
    await syncAttachments(params.supporting_file_ids, 'SUPPORTING_DOC')

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ─── Submit One Pager ─────────────────────────────────────────────────────────

export async function submitOnePager(
  kaizenId: string,
  actorId: string,
): Promise<{
  kaizen_id: string
  workflow_instance_id: string
  current_stage: string
  assigned_to: { id: string; full_name: string } | null
}> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Load kaizen + linked idea
    const res = await client.query<
      KaizenRow & {
        idea_plant_id: string
        idea_zone_id: string
        idea_submitted_by: string
      }
    >(
      `SELECT k.*, i.plant_id AS idea_plant_id, i.zone_id AS idea_zone_id, i.submitted_by AS idea_submitted_by
       FROM kaizens k
       JOIN ideas i ON i.id = k.idea_id
       WHERE k.id = $1`,
      [kaizenId],
    )
    const kaizen = res.rows[0]
    if (!kaizen) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Kaizen not found')

    if (!['IN_PROGRESS', 'PENDING'].includes(kaizen.status)) {
      throw new ServiceError(409, ErrorCodes.CONFLICT, 'One Pager has already been submitted or is not editable')
    }

    // Minimum required fields for One Pager submission
    const missing: string[] = []
    if (!kaizen.title?.trim()) missing.push('Kaizen Title')
    if (!kaizen.solution_implemented?.trim()) missing.push('Solution Implemented')
    if (!kaizen.root_cause_analysis?.trim()) missing.push('Root Cause Analysis')
    if (missing.length) {
      throw new ServiceError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        `Required fields missing: ${missing.join(', ')}`,
      )
    }

    // Retrieve inherited flags from the IDEA_APPROVAL workflow
    const flagsRes = await client.query<{
      machine_design_change: boolean
      safety_review_required: boolean
      qms_review_required: boolean
      sci_tech_required: boolean
    }>(
      `SELECT wf.machine_design_change, wf.safety_review_required,
              wf.qms_review_required, wf.sci_tech_required
       FROM workflow_flags wf
       JOIN workflow_instances wi ON wi.id = wf.workflow_instance_id
       WHERE wi.entity_type = 'idea' AND wi.entity_id = $1
       ORDER BY wi.initiated_at DESC
       LIMIT 1`,
      [kaizen.idea_id],
    )
    const inheritedFlags = flagsRes.rows[0] ?? {
      machine_design_change: false,
      safety_review_required: false,
      qms_review_required: false,
      sci_tech_required: false,
    }

    // Transition status
    await client.query(
      `UPDATE kaizens SET status = 'ONE_PAGER_SUBMITTED', one_pager_submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [kaizenId],
    )

    // Create IMPLEMENTATION_APPROVAL workflow
    const wf = await initiateWorkflowWithClient(client, {
      workflowType: 'IMPLEMENTATION_APPROVAL',
      entityType: 'kaizen',
      entityId: kaizenId,
      plantId: kaizen.idea_plant_id,
      zoneId: kaizen.idea_zone_id,
      initiatedBy: actorId,
      submitterId: actorId,
      inheritedFlags,
    })

    // Audit log (immutable)
    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
       VALUES ($1, 'ONE_PAGER_SUBMITTED', 'kaizen', $2, $3, NOW())`,
      [
        actorId,
        kaizenId,
        JSON.stringify({
          kaizen_id: kaizen.kaizen_id,
          workflow_instance_id: wf.instanceId,
          inherited_flags: inheritedFlags,
        }),
      ],
    )

    await client.query('COMMIT')
    return {
      kaizen_id: kaizen.kaizen_id ?? kaizenId,
      workflow_instance_id: wf.instanceId,
      current_stage: wf.currentStage,
      assigned_to: wf.firstAssignee,
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// ─── Assign Implementation Owner ──────────────────────────────────────────────

export async function assignImplementationOwner(
  kaizenId: string,
  newOwnerId: string,
  actorId: string,
): Promise<void> {
  const check = await pool.query<{ id: string }>(
    `SELECT id FROM kaizens WHERE id = $1`,
    [kaizenId],
  )
  if (!check.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Kaizen not found')

  const userCheck = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE id = $1 AND is_active = TRUE`,
    [newOwnerId],
  )
  if (!userCheck.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'User not found')

  await pool.query(
    `UPDATE kaizens SET implementation_owner = $1, assigned_by = $2, updated_at = NOW() WHERE id = $3`,
    [newOwnerId, actorId, kaizenId],
  )

  await pool.query(
    `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
     VALUES ($1, 'IMPL_OWNER_ASSIGNED', 'kaizen', $2, $3, NOW())`,
    [actorId, kaizenId, JSON.stringify({ new_owner: newOwnerId })],
  )
}
