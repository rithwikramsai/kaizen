import type { KaizenStatus } from '../constants/workflow-stages.js'

export interface Kaizen {
  id: string
  kaizen_id: string
  idea_id: string
  implementation_owner: string
  assigned_by: string
  title: string
  before_description: string
  after_description: string
  benefits_achieved: string
  cost_savings: number | null
  productivity_gain: string | null
  quality_improvement: string | null
  safety_improvement: string | null
  implementation_date: string | null
  status: KaizenStatus
  one_pager_submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface OnePagerRequest {
  title: string
  before_description: string
  after_description: string
  benefits_achieved: string
  cost_savings?: number
  productivity_gain?: string
  quality_improvement?: string
  safety_improvement?: string
  implementation_date?: string
  before_photo_file_ids?: string[]
  after_photo_file_ids?: string[]
  supporting_doc_file_ids?: string[]
  action: 'SAVE_DRAFT' | 'SUBMIT'
}
