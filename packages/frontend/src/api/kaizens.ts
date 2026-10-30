import { authFetch } from './client.js'

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface QueueIdea {
  id: string
  registration_id: string
  title: string
  submitted_at: string | null
  submitted_by: { id: string; full_name: string }
  zone: { name: string }
  department: { name: string } | null
  kaizen: {
    id: string
    kaizen_id: string | null
    status: string
    implementation_owner: string | null
  } | null
}

export interface KaizenAttachment {
  id: string
  file_id: string
  file_name: string
  content_type: string
  file_size: number
  attachment_type: 'BEFORE_PHOTO' | 'AFTER_PHOTO' | 'SUPPORTING_DOC'
}

export interface KaizenDetail {
  id: string
  kaizen_id: string | null
  status: string
  title: string
  implementation_owner: { id: string; full_name: string; employee_id: string } | null
  idea: {
    id: string
    registration_id: string
    problem_statement: string
    description: string
  }
  zone: { name: string | null }
  department: { name: string } | null
  // One Pager fields
  team_members: string | null
  business_impact: string | null
  before_description: string | null
  w1h: {
    who: string | null
    what: string | null
    where: string | null
    when: string | null
    why: string | null
    how: string | null
  }
  five_why: {
    why_1: string | null
    why_2: string | null
    why_3: string | null
    why_4: string | null
    why_5: string | null
  }
  root_cause_analysis: string | null
  category_of_cause: string | null
  solution_implemented: string | null
  results: string | null
  after_description: string | null
  cost: number | null
  benefit: number | null
  cost_benefit_ratio: number | null
  cost_savings: number | null
  early_equipment_mgmt: boolean
  applicable_documents: string | null
  remarks: string | null
  one_pager_submitted_at: string | null
  attachments: KaizenAttachment[]
  created_at: string
  updated_at: string
}

export interface SaveDraftPayload {
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

export interface SubmitOnePagerResult {
  kaizen_id: string
  workflow_instance_id: string
  current_stage: string
  assigned_to: { id: string; full_name: string } | null
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getApprovedQueue(): Promise<QueueIdea[]> {
  const res = await authFetch<{ success: true; data: QueueIdea[] }>('/kaizens/queue')
  return res.data
}

export async function markImplemented(ideaId: string): Promise<{ kaizen_uuid: string; kaizen_id: string }> {
  const res = await authFetch<{ success: true; data: { kaizen_uuid: string; kaizen_id: string } }>(
    `/kaizens/ideas/${ideaId}/mark-implemented`,
    { method: 'POST' },
  )
  return res.data
}

export async function getKaizen(kaizenId: string): Promise<KaizenDetail> {
  const res = await authFetch<{ success: true; data: KaizenDetail }>(`/kaizens/${kaizenId}`)
  return res.data
}

export async function saveKaizenDraft(kaizenId: string, payload: SaveDraftPayload): Promise<void> {
  await authFetch<{ success: true; data: null }>(`/kaizens/${kaizenId}/draft`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function submitOnePager(kaizenId: string): Promise<SubmitOnePagerResult> {
  const res = await authFetch<{ success: true; data: SubmitOnePagerResult }>(`/kaizens/${kaizenId}/submit`, {
    method: 'POST',
  })
  return res.data
}
