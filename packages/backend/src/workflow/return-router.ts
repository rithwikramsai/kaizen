import type { WorkflowStepRow } from './types.js'

export function resolveReturnTarget(
  allSteps: WorkflowStepRow[],
  currentStepOrder: number,
): WorkflowStepRow | null {
  const eligible = allSteps.filter(
    (s) =>
      s.step_order < currentStepOrder &&
      s.status !== 'SKIPPED' &&
      s.status !== 'RETURNED',
  )

  if (eligible.length === 0) return null

  return eligible.reduce((best, s) => (s.step_order > best.step_order ? s : best), eligible[0]!)
}
