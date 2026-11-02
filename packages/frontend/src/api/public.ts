const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options)
  const json = (await res.json()) as { success: boolean; data?: T; message?: string }
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Request failed')
  return json.data as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicEmployeeProfile {
  id: string
  employee_id: string
  full_name: string
  home_plant:       { id: string; name: string; code: string } | null
  home_zone:        { id: string; name: string } | null
  home_department:  { id: string; name: string } | null
  home_function:    { id: string; name: string } | null
  home_hall:        { id: string; name: string } | null
}

export interface PublicMasterData {
  plants:         { id: string; name: string; code: string }[]
  zones:          { id: string; plant_id: string; name: string }[]
  departments:    { id: string; zone_id: string; name: string }[]
  functions:      { id: string; department_id: string; name: string }[]
  halls:          { id: string; function_id: string; name: string }[]
  categories:     { id: string; name: string }[]
  sub_categories: { id: string; category_id: string; name: string }[]
}

export interface PublicSubmitPayload {
  employee_id: string
  plant_id: string
  zone_id: string
  department_id: string
  function_id?: string
  hall_id?: string
  location_id?: string
  value_stream?: string
  category_id: string
  sub_category_id?: string
  problem_statement: string
  description: string
  remarks?: string
  is_anonymous?: boolean
  attachment_file_ids?: string[]
}

export interface PublicSubmitResult {
  id: string
  registration_id: string
  status: string
  workflow_instance_id: string
  current_stage: string
  assigned_to: { id: string; full_name: string } | null
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function lookupEmployee(employeeId: string): Promise<PublicEmployeeProfile> {
  return publicFetch<PublicEmployeeProfile>(
    `/public/employee-lookup?employee_id=${encodeURIComponent(employeeId)}`,
  )
}

export async function getPublicMasterData(): Promise<PublicMasterData> {
  return publicFetch<PublicMasterData>('/public/master-data')
}

export async function submitPublicIdea(payload: PublicSubmitPayload): Promise<PublicSubmitResult> {
  return publicFetch<PublicSubmitResult>('/public/idea-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
