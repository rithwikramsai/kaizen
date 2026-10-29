import type pg from 'pg'
import type {
  TemplateRow,
  TemplateStepRow,
  WorkflowStepRow,
  DynamicStepSpec,
} from './types.js'

export class WorkflowEngine {
  constructor(private client: pg.PoolClient) {}

  async loadTemplate(
    workflowType: string,
  ): Promise<{ template: TemplateRow; steps: TemplateStepRow[] }> {
    const tRes = await this.client.query<TemplateRow>(
      `SELECT id, workflow_type, name, is_active
       FROM workflow_templates WHERE workflow_type = $1 AND is_active = TRUE`,
      [workflowType],
    )
    const template = tRes.rows[0]
    if (!template) throw new Error(`No active workflow template for type: ${workflowType}`)

    const sRes = await this.client.query<TemplateStepRow>(
      `SELECT id, template_id, step_order, stage_code, assigned_role, is_dynamic, sla_hours
       FROM workflow_template_steps
       WHERE template_id = $1
       ORDER BY step_order ASC`,
      [template.id],
    )
    return { template, steps: sRes.rows }
  }

  async resolveAssigneeByRole(roleName: string, plantId: string): Promise<string | null> {
    const res = await this.client.query<{ user_id: string }>(
      `SELECT ur.user_id
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE r.name = $1 AND ur.plant_id = $2
       ORDER BY ur.granted_at ASC
       LIMIT 1`,
      [roleName, plantId],
    )
    return res.rows[0]?.user_id ?? null
  }

  async getSlaHours(
    plantId: string,
    stageCode: string,
    workflowType: string,
    templateSlaHours: number | null,
  ): Promise<number | null> {
    const res = await this.client.query<{ sla_hours: number }>(
      `SELECT sla_hours FROM sla_configs
       WHERE plant_id = $1 AND stage_code = $2 AND workflow_type = $3 AND is_active = TRUE
       LIMIT 1`,
      [plantId, stageCode, workflowType],
    )
    if (res.rows[0]) return res.rows[0].sla_hours
    return templateSlaHours ?? null
  }

  async activateStep(
    stepId: string,
    plantId: string,
    workflowType: string,
    stageCode: string,
    templateSlaHours: number | null,
  ): Promise<void> {
    const slaHours = await this.getSlaHours(plantId, stageCode, workflowType, templateSlaHours)
    const slaInterval = slaHours != null ? `NOW() + interval '${slaHours} hours'` : 'NULL'

    await this.client.query(
      `UPDATE workflow_steps
       SET action_assigned_at = NOW(),
           sla_due_at = ${slaInterval},
           status = 'PENDING'
       WHERE id = $1`,
      [stepId],
    )
  }

  async insertDynamicSteps(
    workflowInstanceId: string,
    plantId: string,
    workflowType: string,
    specs: DynamicStepSpec[],
  ): Promise<WorkflowStepRow[]> {
    const inserted: WorkflowStepRow[] = []
    for (const spec of specs) {
      const assignedUserId = await this.resolveAssigneeByRole(spec.assigned_role, plantId)
      const row = await this.insertStep({
        workflowInstanceId,
        stepOrder: spec.step_order,
        stageCode: spec.stage_code,
        assignedUserId: assignedUserId ?? '',
        isDynamic: true,
        slaHours: spec.sla_hours,
        plantId,
        workflowType,
      })
      inserted.push(row)
    }
    return inserted
  }

  async insertStep(params: {
    workflowInstanceId: string
    stepOrder: number
    stageCode: string
    assignedUserId: string
    isDynamic: boolean
    slaHours: number | null
    plantId: string
    workflowType: string
  }): Promise<WorkflowStepRow> {
    const res = await this.client.query<WorkflowStepRow>(
      `INSERT INTO workflow_steps
         (workflow_instance_id, step_order, stage_code, assigned_user_id, status, is_dynamic, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, NOW())
       RETURNING *`,
      [
        params.workflowInstanceId,
        params.stepOrder,
        params.stageCode,
        params.assignedUserId,
        params.isDynamic,
      ],
    )
    return res.rows[0]!
  }

  async createNotification(params: {
    recipientId: string
    type: string
    title: string
    body: string
    entityType: 'idea' | 'kaizen'
    entityId: string
  }): Promise<void> {
    if (!params.recipientId) return
    await this.client.query(
      `INSERT INTO notifications (recipient_id, notification_type, title, body, entity_type, entity_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        params.recipientId,
        params.type,
        params.title,
        params.body,
        params.entityType,
        params.entityId,
      ],
    )
  }

  async createAuditLog(params: {
    performedBy: string
    action: string
    entityType: string
    entityId: string
    payload?: object
  }): Promise<void> {
    await this.client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        params.performedBy,
        params.action,
        params.entityType,
        params.entityId,
        params.payload ? JSON.stringify(params.payload) : null,
      ],
    )
  }
}
