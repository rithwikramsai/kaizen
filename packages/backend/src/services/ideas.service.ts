import { pool } from '../config/database.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import { parsePagination, buildMeta } from '../utils/pagination.js'
import { generateRegistrationId } from '../utils/id-generator.js'
import { initiateWorkflowWithClient } from './workflow.service.js'
import type { Permission } from '@kiet/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdeaRow {
  id: string
  registration_id: string
  submitted_by: string
  plant_id: string
  zone_id: string
  department_id: string
  function_id: string | null
  hall_id: string | null
  location_id: string | null
  category_id: string
  sub_category_id: string | null
  title: string
  description: string
  problem_statement: string
  proposed_solution: string
  expected_benefits: string | null
  is_anonymous: boolean
  status: string
  submitted_at: Date | null
  created_at: Date
  updated_at: Date
}

interface CreateIdeaParams {
  title: string
  description: string
  problem_statement: string
  proposed_solution: string
  expected_benefits?: string
  is_anonymous?: boolean
  plant_id: string
  zone_id: string
  department_id: string
  function_id?: string
  hall_id?: string
  location_id?: string
  category_id: string
  sub_category_id?: string
  tag_ids?: string[]
  attachment_file_ids?: string[]
  submittedBy: string
}

interface UpdateIdeaParams {
  title?: string
  description?: string
  problem_statement?: string
  proposed_solution?: string
  expected_benefits?: string
  is_anonymous?: boolean
  category_id?: string
  sub_category_id?: string
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createIdea(params: CreateIdeaParams): Promise<{
  id: string
  registration_id: string
  status: string
  workflow_instance_id: string
  current_stage: string
  assigned_to: { id: string; full_name: string } | null
}> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Validate zone belongs to plant
    const zoneCheck = await client.query<{ id: string }>(
      `SELECT id FROM zones WHERE id = $1 AND plant_id = $2 AND is_active = TRUE`,
      [params.zone_id, params.plant_id],
    )
    if (!zoneCheck.rows[0]) {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Zone does not belong to the specified plant')
    }

    // Validate dept belongs to zone
    const deptCheck = await client.query<{ id: string }>(
      `SELECT id FROM departments WHERE id = $1 AND zone_id = $2 AND is_active = TRUE`,
      [params.department_id, params.zone_id],
    )
    if (!deptCheck.rows[0]) {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Department does not belong to the specified zone')
    }

    // Get plant code for registration ID generation
    const plantRes = await client.query<{ code: string }>(
      `SELECT code FROM plants WHERE id = $1`,
      [params.plant_id],
    )
    const plantCode = plantRes.rows[0]?.code ?? ''

    const registrationId = await generateRegistrationId(plantCode)

    // Insert idea
    const ideaRes = await client.query<IdeaRow>(
      `INSERT INTO ideas
         (registration_id, submitted_by, plant_id, zone_id, department_id, function_id, hall_id, location_id,
          category_id, sub_category_id, title, description, problem_statement, proposed_solution,
          expected_benefits, is_anonymous, status, submitted_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'SUBMITTED',NOW(),NOW(),NOW())
       RETURNING *`,
      [
        registrationId,
        params.submittedBy,
        params.plant_id,
        params.zone_id,
        params.department_id,
        params.function_id ?? null,
        params.hall_id ?? null,
        params.location_id ?? null,
        params.category_id,
        params.sub_category_id ?? null,
        params.title,
        params.description,
        params.problem_statement,
        params.proposed_solution,
        params.expected_benefits ?? null,
        params.is_anonymous ?? false,
      ],
    )
    const idea = ideaRes.rows[0]!

    // Insert tags
    if (params.tag_ids?.length) {
      for (const tagId of params.tag_ids) {
        await client.query(
          `INSERT INTO idea_tags (idea_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [idea.id, tagId],
        )
      }
    }

    // Insert attachments
    if (params.attachment_file_ids?.length) {
      for (const fileId of params.attachment_file_ids) {
        await client.query(
          `INSERT INTO idea_attachments (idea_id, file_id, attachment_type) VALUES ($1, $2, 'SUPPORTING_DOC')`,
          [idea.id, fileId],
        )
      }
    }

    // Initiate workflow in the same transaction — idea + workflow are atomic
    const wf = await initiateWorkflowWithClient(client, {
      workflowType: 'IDEA_APPROVAL',
      entityType: 'idea',
      entityId: idea.id,
      initiatedBy: params.submittedBy,
      plantId: params.plant_id,
      submitterId: params.submittedBy,
    })

    // Audit log (immutable — INSERT only)
    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
       VALUES ($1, 'IDEA_SUBMITTED', 'idea', $2, $3, NOW())`,
      [params.submittedBy, idea.id, JSON.stringify({ registration_id: registrationId, title: params.title })],
    )

    await client.query('COMMIT')

    return {
      id: idea.id,
      registration_id: idea.registration_id,
      status: idea.status,
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

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listIdeas(
  actorId: string,
  actorPlantId: string,
  permissions: Permission[],
  query: Record<string, unknown>,
): Promise<{
  ideas: unknown[]
  meta: { page: number; page_size: number; total: number }
}> {
  const { page, pageSize, offset, sortBy, sortDir } = parsePagination(query)

  const conditions: string[] = []
  const values: unknown[] = []
  let paramIdx = 1

  // Scope filter
  if (permissions.includes('CAN_VIEW_ALL_IDEAS')) {
    // no filter
  } else if (permissions.includes('CAN_VIEW_PLANT_IDEAS')) {
    conditions.push(`i.plant_id = $${paramIdx++}`)
    values.push(actorPlantId)
  } else if (permissions.includes('CAN_VIEW_ZONE_IDEAS')) {
    // Get actor's zone_id from their user record
    const userZoneRes = await pool.query<{ zone_id: string }>(
      `SELECT ur.plant_id, z.id as zone_id
       FROM user_roles ur
       JOIN zones z ON z.plant_id = ur.plant_id
       WHERE ur.user_id = $1
       LIMIT 1`,
      [actorId],
    )
    const zoneId = userZoneRes.rows[0]?.zone_id
    if (zoneId) {
      conditions.push(`i.zone_id = $${paramIdx++}`)
      values.push(zoneId)
    } else {
      conditions.push(`i.submitted_by = $${paramIdx++}`)
      values.push(actorId)
    }
  } else {
    conditions.push(`i.submitted_by = $${paramIdx++}`)
    values.push(actorId)
  }

  // Optional filters
  if (query['status']) {
    conditions.push(`i.status = $${paramIdx++}`)
    values.push(query['status'])
  }
  if (query['plant_id']) {
    conditions.push(`i.plant_id = $${paramIdx++}`)
    values.push(query['plant_id'])
  }
  if (query['zone_id']) {
    conditions.push(`i.zone_id = $${paramIdx++}`)
    values.push(query['zone_id'])
  }
  if (query['category_id']) {
    conditions.push(`i.category_id = $${paramIdx++}`)
    values.push(query['category_id'])
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const allowedSortCols = new Set(['created_at', 'submitted_at', 'title', 'status'])
  const safeSortBy = allowedSortCols.has(sortBy) ? `i.${sortBy}` : 'i.created_at'

  const countRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM ideas i
     ${whereClause}`,
    values,
  )
  const total = parseInt(countRes.rows[0]?.count ?? '0', 10)

  const rows = await pool.query(
    `SELECT
       i.id, i.registration_id, i.title, i.status,
       i.is_anonymous,
       u.id AS submitter_id, u.full_name AS submitter_name,
       p.id AS plant_id, p.name AS plant_name,
       z.id AS zone_id, z.name AS zone_name,
       c.id AS category_id, c.name AS category_name,
       wi.current_stage, wi.current_status,
       i.submitted_at, i.created_at
     FROM ideas i
     JOIN users u ON u.id = i.submitted_by
     JOIN plants p ON p.id = i.plant_id
     JOIN zones z ON z.id = i.zone_id
     JOIN categories c ON c.id = i.category_id
     LEFT JOIN workflow_instances wi ON wi.entity_type = 'idea' AND wi.entity_id = i.id
     ${whereClause}
     ORDER BY ${safeSortBy} ${sortDir}
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...values, pageSize, offset],
  )

  const ideas = rows.rows.map((r) => ({
    id: r.id as string,
    registration_id: r.registration_id as string,
    title: r.title as string,
    status: r.status as string,
    submitted_by: r.is_anonymous
      ? { id: r.submitter_id as string, full_name: 'Anonymous' }
      : { id: r.submitter_id as string, full_name: r.submitter_name as string },
    plant: { id: r.plant_id as string, name: r.plant_name as string },
    zone: { id: r.zone_id as string, name: r.zone_name as string },
    category: { id: r.category_id as string, name: r.category_name as string },
    current_stage: (r.current_stage as string) ?? null,
    current_status: (r.current_status as string) ?? null,
    submitted_at: r.submitted_at ? (r.submitted_at as Date).toISOString() : null,
    created_at: (r.created_at as Date).toISOString(),
  }))

  return { ideas, meta: buildMeta(page, pageSize, total) }
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

export async function getIdeaById(
  id: string,
  actorId: string,
  actorPlantId: string,
  permissions: Permission[],
): Promise<unknown> {
  const ideaRes = await pool.query(
    `SELECT
       i.*,
       u.id AS submitter_id, u.full_name AS submitter_name,
       p.id AS plant_id_ref, p.name AS plant_name,
       z.id AS zone_id_ref, z.name AS zone_name,
       c.id AS category_id_ref, c.name AS category_name,
       sc.id AS sub_category_id_ref, sc.name AS sub_category_name,
       wi.id AS workflow_instance_id, wi.current_stage, wi.current_status
     FROM ideas i
     JOIN users u ON u.id = i.submitted_by
     JOIN plants p ON p.id = i.plant_id
     JOIN zones z ON z.id = i.zone_id
     JOIN categories c ON c.id = i.category_id
     LEFT JOIN sub_categories sc ON sc.id = i.sub_category_id
     LEFT JOIN workflow_instances wi ON wi.entity_type = 'idea' AND wi.entity_id = i.id
     WHERE i.id = $1`,
    [id],
  )
  const row = ideaRes.rows[0]
  if (!row) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Idea not found')

  // Access control
  const isOwner = row.submitted_by === actorId
  const hasPLANT = permissions.includes('CAN_VIEW_PLANT_IDEAS') && row.plant_id === actorPlantId
  const hasZone = permissions.includes('CAN_VIEW_ZONE_IDEAS') && row.plant_id === actorPlantId
  const hasAll = permissions.includes('CAN_VIEW_ALL_IDEAS')

  if (!isOwner && !hasPLANT && !hasZone && !hasAll) {
    throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'You do not have access to this idea')
  }

  // Attachments
  const attachmentsRes = await pool.query(
    `SELECT ia.id, ia.attachment_type, fm.id AS file_id, fm.file_name, fm.content_type, fm.file_size
     FROM idea_attachments ia
     JOIN file_metadata fm ON fm.id = ia.file_id
     WHERE ia.idea_id = $1`,
    [id],
  )

  // Tags
  const tagsRes = await pool.query(
    `SELECT t.id, t.name, t.color
     FROM idea_tags it
     JOIN tags t ON t.id = it.tag_id
     WHERE it.idea_id = $1`,
    [id],
  )

  return {
    id: row.id as string,
    registration_id: row.registration_id as string,
    title: row.title as string,
    description: row.description as string,
    problem_statement: row.problem_statement as string,
    proposed_solution: row.proposed_solution as string,
    expected_benefits: row.expected_benefits as string | null,
    is_anonymous: row.is_anonymous as boolean,
    status: row.status as string,
    submitted_by: row.is_anonymous
      ? { id: row.submitter_id as string, full_name: 'Anonymous' }
      : { id: row.submitter_id as string, full_name: row.submitter_name as string },
    plant: { id: row.plant_id_ref as string, name: row.plant_name as string },
    zone: { id: row.zone_id_ref as string, name: row.zone_name as string },
    category: { id: row.category_id_ref as string, name: row.category_name as string },
    sub_category: row.sub_category_id_ref
      ? { id: row.sub_category_id_ref as string, name: row.sub_category_name as string }
      : null,
    workflow: {
      instance_id: row.workflow_instance_id as string | null,
      current_stage: row.current_stage as string | null,
      current_status: row.current_status as string | null,
    },
    attachments: attachmentsRes.rows.map((a) => ({
      id: a.id as string,
      file_id: a.file_id as string,
      file_name: a.file_name as string,
      content_type: a.content_type as string,
      file_size: a.file_size as number,
      attachment_type: a.attachment_type as string,
    })),
    tags: tagsRes.rows.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      color: t.color as string | null,
    })),
    submitted_at: row.submitted_at ? (row.submitted_at as Date).toISOString() : null,
    created_at: (row.created_at as Date).toISOString(),
    updated_at: (row.updated_at as Date).toISOString(),
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateIdea(id: string, actorId: string, body: UpdateIdeaParams): Promise<unknown> {
  const existing = await pool.query<{ submitted_by: string; status: string }>(
    `SELECT submitted_by, status FROM ideas WHERE id = $1`,
    [id],
  )
  const idea = existing.rows[0]
  if (!idea) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Idea not found')
  if (idea.submitted_by !== actorId) throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'You can only edit your own ideas')
  if (idea.status !== 'DRAFT') throw new ServiceError(409, ErrorCodes.CONFLICT, 'Only DRAFT ideas can be edited')

  const res = await pool.query<IdeaRow>(
    `UPDATE ideas SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       problem_statement = COALESCE($3, problem_statement),
       proposed_solution = COALESCE($4, proposed_solution),
       expected_benefits = COALESCE($5, expected_benefits),
       is_anonymous = COALESCE($6, is_anonymous),
       category_id = COALESCE($7, category_id),
       sub_category_id = COALESCE($8, sub_category_id),
       updated_at = NOW()
     WHERE id = $9
     RETURNING id, title, status, updated_at`,
    [
      body.title ?? null,
      body.description ?? null,
      body.problem_statement ?? null,
      body.proposed_solution ?? null,
      body.expected_benefits ?? null,
      body.is_anonymous ?? null,
      body.category_id ?? null,
      body.sub_category_id ?? null,
      id,
    ],
  )
  return res.rows[0]
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteIdea(id: string, actorId: string): Promise<void> {
  const existing = await pool.query<{ submitted_by: string; status: string }>(
    `SELECT submitted_by, status FROM ideas WHERE id = $1`,
    [id],
  )
  const idea = existing.rows[0]
  if (!idea) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Idea not found')
  if (idea.submitted_by !== actorId) throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'You can only delete your own ideas')
  if (idea.status !== 'DRAFT') throw new ServiceError(409, ErrorCodes.CONFLICT, 'Only DRAFT ideas can be deleted')

  await pool.query(`DELETE FROM ideas WHERE id = $1`, [id])
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export async function getIdeaTimeline(
  id: string,
  actorId: string,
  actorPlantId: string,
  permissions: Permission[],
): Promise<unknown[]> {
  // Verify idea exists and get access info
  const ideaRes = await pool.query<{ submitted_by: string; plant_id: string }>(
    `SELECT submitted_by, plant_id FROM ideas WHERE id = $1`,
    [id],
  )
  const idea = ideaRes.rows[0]
  if (!idea) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Idea not found')

  const isOwner = idea.submitted_by === actorId
  const hasZone = permissions.includes('CAN_VIEW_ZONE_IDEAS') && idea.plant_id === actorPlantId
  const hasPLANT = permissions.includes('CAN_VIEW_PLANT_IDEAS') && idea.plant_id === actorPlantId
  const hasAll = permissions.includes('CAN_VIEW_ALL_IDEAS')

  if (!isOwner && !hasZone && !hasPLANT && !hasAll) {
    throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'You do not have access to this idea timeline')
  }

  const stepsRes = await pool.query(
    `SELECT
       ws.stage_code, ws.status, ws.comment,
       ws.action_taken_at, ws.sla_due_at,
       u.id AS actor_id, u.full_name AS actor_name
     FROM workflow_instances wi
     JOIN workflow_steps ws ON ws.workflow_instance_id = wi.id
     LEFT JOIN users u ON u.id = ws.assigned_user_id
     WHERE wi.entity_type = 'idea' AND wi.entity_id = $1
     ORDER BY ws.step_order ASC`,
    [id],
  )

  return stepsRes.rows.map((s) => ({
    stage: s.stage_code as string,
    status: s.status as string,
    actor: s.actor_id ? { id: s.actor_id as string, full_name: s.actor_name as string } : null,
    comment: s.comment as string | null,
    action_taken_at: s.action_taken_at ? (s.action_taken_at as Date).toISOString() : null,
    sla_due_at: s.sla_due_at ? (s.sla_due_at as Date).toISOString() : null,
  }))
}
