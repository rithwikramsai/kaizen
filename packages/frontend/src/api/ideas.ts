import { authFetch } from './client.js'
import type { IdeaListItem, CreateIdeaRequest } from '@kiet/shared'

export interface IdeaDetail {
  id: string
  registration_id: string
  title: string
  description: string
  problem_statement: string
  proposed_solution: string | null
  expected_benefits: string | null
  value_stream: string | null
  remarks: string | null
  is_anonymous: boolean
  status: string
  submitted_at: string | null
  created_at: string
  updated_at: string
  submitted_by: { id: string; full_name: string } | null
  plant: { id: string; name: string }
  zone: { id: string; name: string }
  department: { id: string; name: string } | null
  function: { id: string; name: string } | null
  hall: { id: string; name: string } | null
  location: { id: string; name: string } | null
  category: { id: string; name: string }
  sub_category: { id: string; name: string } | null
  workflow_instance_id: string | null
  current_stage: string | null
  current_status: string | null
  attachments: { file_id: string; file_name: string; content_type: string }[]
  tags: { id: string; name: string; color: string }[]
}

export interface CreateIdeaResult {
  id: string
  registration_id: string
  status: string
  workflow_instance_id: string
  current_stage: string
  assigned_to: { id: string; full_name: string } | null
}

export interface TimelineEntry {
  stage: string
  status: string
  actor: { id: string; full_name: string } | null
  comment: string | null
  action_taken_at: string | null
  sla_due_at: string | null
}

export interface IdeasListParams {
  status?: string
  plant_id?: string
  zone_id?: string
  category_id?: string
  page?: number
  page_size?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  meta: { page: number; page_size: number; total: number }
}

function buildQuery(params?: IdeasListParams): string {
  if (!params) return ''
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export async function listIdeas(params?: IdeasListParams): Promise<PaginatedResponse<IdeaListItem>> {
  return authFetch<PaginatedResponse<IdeaListItem>>(`/ideas${buildQuery(params)}`)
}

export async function getIdea(id: string): Promise<{ success: true; data: IdeaDetail }> {
  return authFetch<{ success: true; data: IdeaDetail }>(`/ideas/${id}`)
}

export async function createIdea(body: CreateIdeaRequest): Promise<{ success: true; data: CreateIdeaResult }> {
  return authFetch<{ success: true; data: CreateIdeaResult }>('/ideas', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateIdea(id: string, body: Partial<CreateIdeaRequest>): Promise<{ success: true; data: IdeaDetail }> {
  return authFetch<{ success: true; data: IdeaDetail }>(`/ideas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteIdea(id: string): Promise<void> {
  await authFetch<{ success: true; data: null }>(`/ideas/${id}`, { method: 'DELETE' })
}

export async function getIdeaTimeline(id: string): Promise<{ success: true; data: TimelineEntry[] }> {
  return authFetch<{ success: true; data: TimelineEntry[] }>(`/ideas/${id}/timeline`)
}

export interface WorkflowStep {
  step_order: number
  stage_code: string
  status: string
  assigned_to: { id: string; full_name: string }
  action_taken_at: string | null
  sla_due_at: string | null
}

export interface WorkflowStatus {
  workflow_instance_id: string
  workflow_type: string
  current_stage: string
  current_status: string
  steps: WorkflowStep[]
}

export async function getIdeaWorkflowStatus(id: string): Promise<WorkflowStatus> {
  const res = await authFetch<{ success: true; data: WorkflowStatus }>(`/workflow/ideas/${id}/status`)
  return res.data
}

export interface ReviewQueueItem {
  entity_type: 'idea' | 'kaizen'
  entity_id: string
  registration_id: string | null
  title: string
  submitted_by_name: string | null
  plant_name: string | null
  zone_name: string | null
  stage_code: string
  sla_due_at: string | null
  workflow_instance_id: string
}

export async function getMyReviewQueue(): Promise<ReviewQueueItem[]> {
  const res = await authFetch<{ success: true; data: ReviewQueueItem[] }>('/workflow/my-queue')
  return res.data
}

export async function submitIdeaWorkflowAction(
  id: string,
  payload: {
    action: 'APPROVE' | 'RETURN' | 'REJECT'
    comment?: string
    flags?: {
      safety_review_required?: boolean
      qms_review_required?: boolean
      machine_design_change?: boolean
    }
  },
): Promise<void> {
  await authFetch<{ success: true; data: unknown }>(`/workflow/ideas/${id}/action`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
