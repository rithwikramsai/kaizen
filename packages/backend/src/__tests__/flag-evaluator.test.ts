import { evaluateIdeaApprovalFlags, evaluateImplApprovalFlags } from '../workflow/flag-evaluator.js'

describe('evaluateIdeaApprovalFlags', () => {
  it('returns empty array when no flags set', () => {
    expect(evaluateIdeaApprovalFlags({
      safety_review_required: false,
      qms_review_required: false,
      machine_design_change: false,
    })).toEqual([])
  })

  it('returns SAFETY_REVIEW at order 3 when safety flag set', () => {
    const specs = evaluateIdeaApprovalFlags({
      safety_review_required: true,
      qms_review_required: false,
      machine_design_change: false,
    })
    expect(specs).toHaveLength(1)
    expect(specs[0]).toMatchObject({ stage_code: 'SAFETY_REVIEW', step_order: 3, sla_hours: 48 })
  })

  it('returns QUALITY_REVIEW at order 3 when only qms flag set', () => {
    const specs = evaluateIdeaApprovalFlags({
      safety_review_required: false,
      qms_review_required: true,
      machine_design_change: false,
    })
    expect(specs).toHaveLength(1)
    expect(specs[0]).toMatchObject({ stage_code: 'QUALITY_REVIEW', step_order: 3, sla_hours: 48 })
  })

  it('returns both safety and quality steps with correct ordering when both flags set', () => {
    const specs = evaluateIdeaApprovalFlags({
      safety_review_required: true,
      qms_review_required: true,
      machine_design_change: false,
    })
    expect(specs).toHaveLength(2)
    expect(specs[0]).toMatchObject({ stage_code: 'SAFETY_REVIEW', step_order: 3 })
    expect(specs[1]).toMatchObject({ stage_code: 'QUALITY_REVIEW', step_order: 4 })
  })

  it('does NOT insert a step for machine_design_change in IDEA_APPROVAL', () => {
    const specs = evaluateIdeaApprovalFlags({
      safety_review_required: false,
      qms_review_required: false,
      machine_design_change: true,
    })
    expect(specs).toHaveLength(0)
  })

  it('machine_design_change does not affect ordering of other steps', () => {
    const specs = evaluateIdeaApprovalFlags({
      safety_review_required: true,
      qms_review_required: true,
      machine_design_change: true,
    })
    expect(specs).toHaveLength(2)
    expect(specs[0]!.step_order).toBe(3)
    expect(specs[1]!.step_order).toBe(4)
  })
})

describe('evaluateImplApprovalFlags', () => {
  it('returns empty array when no flags set', () => {
    expect(evaluateImplApprovalFlags({
      machine_design_change: false,
      safety_review_required: false,
      qms_review_required: false,
      sci_tech_required: false,
    })).toEqual([])
  })

  it('returns SME_REVIEW at order 3 when machine_design_change set', () => {
    const specs = evaluateImplApprovalFlags({
      machine_design_change: true,
      safety_review_required: false,
      qms_review_required: false,
      sci_tech_required: false,
    })
    expect(specs).toHaveLength(1)
    expect(specs[0]).toMatchObject({ stage_code: 'SME_REVIEW', step_order: 3, sla_hours: 72 })
  })

  it('returns all 4 steps with correct ordering when all flags set', () => {
    const specs = evaluateImplApprovalFlags({
      machine_design_change: true,
      safety_review_required: true,
      qms_review_required: true,
      sci_tech_required: true,
    })
    expect(specs).toHaveLength(4)
    expect(specs[0]).toMatchObject({ stage_code: 'SME_REVIEW', step_order: 3 })
    expect(specs[1]).toMatchObject({ stage_code: 'SAFETY_REVIEW', step_order: 4 })
    expect(specs[2]).toMatchObject({ stage_code: 'QUALITY_REVIEW', step_order: 5 })
    expect(specs[3]).toMatchObject({ stage_code: 'SCI_TECH_UPLOAD', step_order: 6 })
  })

  it('sci_tech_required without other flags uses order 3', () => {
    const specs = evaluateImplApprovalFlags({
      machine_design_change: false,
      safety_review_required: false,
      qms_review_required: false,
      sci_tech_required: true,
    })
    expect(specs).toHaveLength(1)
    expect(specs[0]).toMatchObject({ stage_code: 'SCI_TECH_UPLOAD', step_order: 3, sla_hours: 120 })
  })

  it('safety and qms without SME starts at order 3', () => {
    const specs = evaluateImplApprovalFlags({
      machine_design_change: false,
      safety_review_required: true,
      qms_review_required: true,
      sci_tech_required: false,
    })
    expect(specs).toHaveLength(2)
    expect(specs[0]).toMatchObject({ stage_code: 'SAFETY_REVIEW', step_order: 3 })
    expect(specs[1]).toMatchObject({ stage_code: 'QUALITY_REVIEW', step_order: 4 })
  })
})
