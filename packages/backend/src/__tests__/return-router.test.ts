import { resolveReturnTarget } from '../workflow/return-router.js'
import type { WorkflowStepRow } from '../workflow/types.js'

function makeStep(step_order: number, status: string): WorkflowStepRow {
  return {
    id: `step-${step_order}`,
    workflow_instance_id: 'wf-1',
    step_order,
    stage_code: `STAGE_${step_order}`,
    assigned_user_id: 'user-1',
    status,
    comment: null,
    action_taken_at: null,
    action_assigned_at: null,
    sla_due_at: null,
    escalated: false,
    is_dynamic: false,
    created_at: new Date(),
  }
}

describe('resolveReturnTarget', () => {
  it('returns null when there are no prior steps', () => {
    const steps = [makeStep(1, 'PENDING')]
    expect(resolveReturnTarget(steps, 1)).toBeNull()
  })

  it('returns the highest eligible prior step', () => {
    const steps = [
      makeStep(1, 'APPROVED'),
      makeStep(2, 'APPROVED'),
      makeStep(3, 'PENDING'),
    ]
    const target = resolveReturnTarget(steps, 3)
    expect(target?.step_order).toBe(2)
  })

  it('skips SKIPPED steps when finding return target', () => {
    const steps = [
      makeStep(1, 'APPROVED'),
      makeStep(2, 'SKIPPED'),
      makeStep(3, 'PENDING'),
    ]
    const target = resolveReturnTarget(steps, 3)
    expect(target?.step_order).toBe(1)
  })

  it('skips RETURNED steps when finding return target', () => {
    const steps = [
      makeStep(1, 'APPROVED'),
      makeStep(2, 'RETURNED'),
      makeStep(3, 'PENDING'),
    ]
    const target = resolveReturnTarget(steps, 3)
    expect(target?.step_order).toBe(1)
  })

  it('returns null when all prior steps are SKIPPED', () => {
    const steps = [
      makeStep(1, 'SKIPPED'),
      makeStep(2, 'PENDING'),
    ]
    const target = resolveReturnTarget(steps, 2)
    expect(target).toBeNull()
  })

  it('returns null when all prior steps are SKIPPED or RETURNED', () => {
    const steps = [
      makeStep(1, 'SKIPPED'),
      makeStep(2, 'RETURNED'),
      makeStep(3, 'PENDING'),
    ]
    const target = resolveReturnTarget(steps, 3)
    expect(target).toBeNull()
  })

  it('picks step 3 over step 1 when both are eligible prior steps at step 4', () => {
    const steps = [
      makeStep(1, 'APPROVED'),
      makeStep(2, 'SKIPPED'),
      makeStep(3, 'APPROVED'),
      makeStep(4, 'PENDING'),
    ]
    const target = resolveReturnTarget(steps, 4)
    expect(target?.step_order).toBe(3)
  })
})
