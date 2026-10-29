export interface WorkflowInstanceRow {
  id: string
  template_id: string
  entity_type: 'idea' | 'kaizen'
  entity_id: string
  workflow_type: string
  current_stage: string
  current_status: string
  initiated_by: string
  initiated_at: Date
  completed_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface WorkflowStepRow {
  id: string
  workflow_instance_id: string
  step_order: number
  stage_code: string
  assigned_user_id: string
  status: string
  comment: string | null
  action_taken_at: Date | null
  action_assigned_at: Date | null
  sla_due_at: Date | null
  escalated: boolean
  is_dynamic: boolean
  created_at: Date
}

export interface WorkflowFlagsRow {
  id: string
  workflow_instance_id: string
  machine_design_change: boolean
  safety_review_required: boolean
  qms_review_required: boolean
  sci_tech_required: boolean
  set_by_user_id: string | null
  set_at: Date | null
}

export interface TemplateRow {
  id: string
  workflow_type: string
  name: string
  is_active: boolean
}

export interface TemplateStepRow {
  id: string
  template_id: string
  step_order: number
  stage_code: string
  assigned_role: string
  is_dynamic: boolean
  sla_hours: number | null
}

export interface InitiateParams {
  workflowType: 'IDEA_APPROVAL' | 'IMPLEMENTATION_APPROVAL'
  entityType: 'idea' | 'kaizen'
  entityId: string
  plantId: string
  initiatedBy: string
  submitterId: string
  inheritedFlags?: {
    machine_design_change: boolean
    safety_review_required: boolean
    qms_review_required: boolean
    sci_tech_required: boolean
  }
}

export interface DynamicStepSpec {
  stage_code: string
  assigned_role: string
  step_order: number
  sla_hours: number | null
}
