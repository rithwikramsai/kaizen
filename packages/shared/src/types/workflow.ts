import type {
  WorkflowType,
  WorkflowStatus,
  StepStatus,
  WorkflowAction,
} from '../constants/workflow-stages.js'

export interface WorkflowFlags {
  machine_design_change: boolean
  safety_review_required: boolean
  qms_review_required: boolean
  sci_tech_required: boolean
}

export interface WorkflowInstance {
  id: string
  template_id: string
  entity_type: 'idea' | 'kaizen'
  entity_id: string
  workflow_type: WorkflowType
  current_stage: string
  current_status: WorkflowStatus
  initiated_by: string
  initiated_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  workflow_instance_id: string
  step_order: number
  stage_code: string
  assigned_user_id: string
  status: StepStatus
  comment: string | null
  action_taken_at: string | null
  action_assigned_at: string
  sla_due_at: string | null
  escalated: boolean
  is_dynamic: boolean
  created_at: string
}

export interface WorkflowActionRequest {
  action: WorkflowAction
  comment?: string
  flags?: Partial<WorkflowFlags>
}

export interface WorkflowActionResult {
  workflow_instance_id: string
  previous_stage: string
  current_stage: string
  current_status: WorkflowStatus
  next_assignee: { id: string; full_name: string } | null
}

export interface WorkflowStatusResponse {
  workflow_instance_id: string
  workflow_type: WorkflowType
  current_stage: string
  current_status: WorkflowStatus
  steps: Array<{
    step_order: number
    stage_code: string
    status: StepStatus
    assigned_to: { id: string; full_name: string }
    action_taken_at: string | null
    sla_due_at: string | null
  }>
}
