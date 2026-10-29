import type { IdeaStatus } from '../constants/workflow-stages.js'

export interface Idea {
  id: string
  registration_id: string
  submitted_by: string
  plant_id: string
  zone_id: string
  department_id: string
  function_id: string | null
  hall_id: string | null
  location_id: string | null
  category_id: string
  sub_category_id: string | null
  title: string
  description: string
  problem_statement: string
  proposed_solution: string
  expected_benefits: string | null
  is_anonymous: boolean
  status: IdeaStatus
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface IdeaListItem {
  id: string
  registration_id: string
  title: string
  status: IdeaStatus
  submitted_by: { id: string; full_name: string }
  plant: { id: string; name: string }
  zone: { id: string; name: string }
  category: { id: string; name: string }
  current_stage: string
  current_status: string
  submitted_at: string | null
  created_at: string
}

export interface CreateIdeaRequest {
  title: string
  description: string
  problem_statement: string
  proposed_solution: string
  expected_benefits?: string
  is_anonymous?: boolean
  plant_id: string
  zone_id: string
  department_id: string
  function_id?: string
  hall_id?: string
  location_id?: string
  category_id: string
  sub_category_id?: string
  tag_ids?: string[]
  attachment_file_ids?: string[]
}
