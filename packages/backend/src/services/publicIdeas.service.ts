import { pool } from '../config/database.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import { createIdea, type CreateIdeaParams } from './ideas.service.js'
import { uploadFile } from './files.service.js'

// ─── Employee lookup ──────────────────────────────────────────────────────────

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

export async function lookupEmployeeById(employeeId: string): Promise<PublicEmployeeProfile> {
  const res = await pool.query<{
    id: string; employee_id: string; full_name: string; is_active: boolean
    plant_id: string | null; plant_name: string | null; plant_code: string | null
    zone_id: string | null; zone_name: string | null
    dept_id: string | null; dept_name: string | null
    func_id: string | null; func_name: string | null
    hall_id: string | null; hall_name: string | null
  }>(
    `SELECT u.id, u.employee_id, u.full_name, u.is_active,
       p.id  AS plant_id,  p.name  AS plant_name,  p.code AS plant_code,
       z.id  AS zone_id,   z.name  AS zone_name,
       d.id  AS dept_id,   d.name  AS dept_name,
       f.id  AS func_id,   f.name  AS func_name,
       h.id  AS hall_id,   h.name  AS hall_name
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN plants      p ON p.id = ur.plant_id
     LEFT JOIN zones       z ON z.id = ur.zone_id
     LEFT JOIN departments d ON d.id = ur.department_id
     LEFT JOIN functions   f ON f.id = ur.function_id
     LEFT JOIN halls       h ON h.id = ur.hall_id
     WHERE LOWER(u.employee_id) = LOWER($1)
     ORDER BY ur.granted_at ASC
     LIMIT 1`,
    [employeeId],
  )

  const row = res.rows[0]
  if (!row) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Employee ID not found')
  if (!row.is_active) throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Account is inactive')

  return {
    id:              row.id,
    employee_id:     row.employee_id,
    full_name:       row.full_name,
    home_plant:      row.plant_id ? { id: row.plant_id, name: row.plant_name!, code: row.plant_code! } : null,
    home_zone:       row.zone_id  ? { id: row.zone_id,  name: row.zone_name!  } : null,
    home_department: row.dept_id  ? { id: row.dept_id,  name: row.dept_name!  } : null,
    home_function:   row.func_id  ? { id: row.func_id,  name: row.func_name!  } : null,
    home_hall:       row.hall_id  ? { id: row.hall_id,  name: row.hall_name!  } : null,
  }
}

// ─── Public master data ───────────────────────────────────────────────────────

export interface PublicMasterData {
  plants:         { id: string; name: string; code: string }[]
  zones:          { id: string; plant_id: string; name: string }[]
  departments:    { id: string; zone_id: string; name: string }[]
  functions:      { id: string; department_id: string; name: string }[]
  halls:          { id: string; function_id: string; name: string }[]
  locations:      { id: string; hall_id: string; name: string }[]
  categories:     { id: string; name: string }[]
  sub_categories: { id: string; category_id: string; name: string }[]
}

export async function getPublicMasterData(): Promise<PublicMasterData> {
  const [plants, zones, depts, funcs, halls, locs, cats, subCats] = await Promise.all([
    pool.query<{ id: string; name: string; code: string }>(
      `SELECT id, name, code FROM plants WHERE is_active = TRUE ORDER BY name`),
    pool.query<{ id: string; plant_id: string; name: string }>(
      `SELECT id, plant_id, name FROM zones WHERE is_active = TRUE ORDER BY name`),
    pool.query<{ id: string; zone_id: string; name: string }>(
      `SELECT id, zone_id, name FROM departments WHERE is_active = TRUE ORDER BY name`),
    pool.query<{ id: string; department_id: string; name: string }>(
      `SELECT id, department_id, name FROM functions WHERE is_active = TRUE ORDER BY name`),
    pool.query<{ id: string; function_id: string; name: string }>(
      `SELECT id, function_id, name FROM halls WHERE is_active = TRUE ORDER BY name`),
    pool.query<{ id: string; hall_id: string; name: string }>(
      `SELECT id, hall_id, name FROM locations WHERE is_active = TRUE ORDER BY name`),
    pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM categories WHERE is_active = TRUE ORDER BY name`),
    pool.query<{ id: string; category_id: string; name: string }>(
      `SELECT id, category_id, name FROM sub_categories WHERE is_active = TRUE ORDER BY name`),
  ])

  return {
    plants:         plants.rows,
    zones:          zones.rows,
    departments:    depts.rows,
    functions:      funcs.rows,
    halls:          halls.rows,
    locations:      locs.rows,
    categories:     cats.rows,
    sub_categories: subCats.rows,
  }
}

// ─── Public file upload ───────────────────────────────────────────────────────

export async function uploadPublicFile(
  file: Express.Multer.File,
  employeeId: string,
): Promise<{ file_id: string; file_name: string; file_size: number; content_type: string }> {
  // Look up employee to get their user UUID; pass null if not found (uploaded_by is nullable)
  let uploadedBy: string | null = null
  try {
    const emp = await lookupEmployeeById(employeeId)
    uploadedBy = emp.id
  } catch {
    // If employee lookup fails, upload as anonymous (uploaded_by = null)
  }
  return uploadFile(file, 'idea', uploadedBy)
}

// ─── Submit idea as employee (public, no session) ─────────────────────────────

export interface PublicIdeaSubmitParams {
  employee_id:       string
  plant_id:          string
  zone_id:           string
  department_id:     string
  function_id?:      string | undefined
  hall_id?:          string | undefined
  location_id?:      string | undefined
  value_stream?:     string | undefined
  category_id:       string
  sub_category_id?:  string | undefined
  problem_statement: string
  description:       string
  remarks?:          string | undefined
  is_anonymous?:     boolean | undefined
  attachment_file_ids?: string[] | undefined
}

export async function submitIdeaAsEmployee(params: PublicIdeaSubmitParams) {
  const employee = await lookupEmployeeById(params.employee_id)

  const createParams: CreateIdeaParams = {
    plant_id:          params.plant_id,
    zone_id:           params.zone_id,
    department_id:     params.department_id,
    category_id:       params.category_id,
    problem_statement: params.problem_statement,
    description:       params.description,
    is_anonymous:      params.is_anonymous ?? false,
    submittedBy:       employee.id,
    ...(params.function_id      ? { function_id:      params.function_id      } : {}),
    ...(params.hall_id          ? { hall_id:          params.hall_id          } : {}),
    ...(params.location_id      ? { location_id:      params.location_id      } : {}),
    ...(params.value_stream     ? { value_stream:     params.value_stream     } : {}),
    ...(params.sub_category_id  ? { sub_category_id:  params.sub_category_id  } : {}),
    ...(params.remarks          ? { remarks:          params.remarks          } : {}),
    ...(params.attachment_file_ids?.length
      ? { attachment_file_ids: params.attachment_file_ids }
      : {}),
  }

  return createIdea(createParams)
}

// ─── QR code data ─────────────────────────────────────────────────────────────

export interface QrData {
  url:           string
  label:         string
  plant_code?:   string
  generated_at:  string
}

export function getQrData(baseUrl: string, plantCode?: string): QrData {
  const url = plantCode
    ? `${baseUrl}/submit-anonymous?plant=${encodeURIComponent(plantCode)}`
    : `${baseUrl}/submit-anonymous`

  return {
    url,
    label:        plantCode ? `Scan to submit a Kaizen idea (${plantCode})` : 'Scan to submit a Kaizen idea',
    ...(plantCode ? { plant_code: plantCode } : {}),
    generated_at: new Date().toISOString(),
  }
}
