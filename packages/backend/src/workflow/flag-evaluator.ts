import type { DynamicStepSpec } from './types.js'

export function evaluateIdeaApprovalFlags(flags: {
  safety_review_required: boolean
  qms_review_required: boolean
  machine_design_change: boolean
}): DynamicStepSpec[] {
  const specs: DynamicStepSpec[] = []
  let nextOrder = 3

  if (flags.safety_review_required) {
    specs.push({ stage_code: 'SAFETY_REVIEW', assigned_role: 'Plant Safety', step_order: nextOrder++, sla_hours: 48 })
  }
  if (flags.qms_review_required) {
    specs.push({ stage_code: 'QUALITY_REVIEW', assigned_role: 'Plant Quality', step_order: nextOrder++, sla_hours: 48 })
  }
  // machine_design_change: no step inserted in IDEA_APPROVAL — flag stored only

  return specs
}

export function evaluateImplApprovalFlags(flags: {
  machine_design_change: boolean
  safety_review_required: boolean
  qms_review_required: boolean
  sci_tech_required: boolean
}): DynamicStepSpec[] {
  const specs: DynamicStepSpec[] = []
  let nextOrder = 3

  if (flags.machine_design_change) {
    specs.push({ stage_code: 'SME_REVIEW', assigned_role: 'SME', step_order: nextOrder++, sla_hours: 72 })
  }
  if (flags.safety_review_required) {
    specs.push({ stage_code: 'SAFETY_REVIEW', assigned_role: 'Plant Safety', step_order: nextOrder++, sla_hours: 48 })
  }
  if (flags.qms_review_required) {
    specs.push({ stage_code: 'QUALITY_REVIEW', assigned_role: 'Plant Quality', step_order: nextOrder++, sla_hours: 48 })
  }
  if (flags.sci_tech_required) {
    specs.push({ stage_code: 'SCI_TECH_UPLOAD', assigned_role: 'HOD', step_order: nextOrder++, sla_hours: 120 })
  }

  return specs
}
