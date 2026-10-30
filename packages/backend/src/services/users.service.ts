import { pool } from '../config/database.js'
import { hashPassword } from '../utils/hash.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import type { ParsedPagination } from '../utils/pagination.js'

export interface UserRecord {
  id: string
  employee_id: string
  email: string
  full_name: string
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoleRecord {
  id: string
  name: string
  description: string | null
  is_active: boolean
}

export interface PermissionRecord {
  id: string
  code: string
  description: string | null
}

export interface CreateUserInput {
  employee_id: string
  email: string
  full_name: string
  phone?: string | undefined
  password: string
  plant_id?: string | undefined
  role_id?: string | undefined
  granted_by: string
}

export interface UpdateUserInput {
  full_name?: string | undefined
  phone?: string | undefined
  email?: string | undefined
}

export interface MyProfileResult {
  id: string
  employee_id: string
  email: string
  full_name: string
  home_plant: { id: string; name: string; code: string } | null
  home_zone: { id: string; name: string } | null
  home_department: { id: string; name: string } | null
  home_function: { id: string; name: string } | null
  home_hall: { id: string; name: string } | null
}

export async function getMyProfile(userId: string): Promise<MyProfileResult> {
  const res = await pool.query<{
    id: string; employee_id: string; email: string; full_name: string
    plant_id: string | null; plant_name: string | null; plant_code: string | null
    zone_id: string | null; zone_name: string | null
    dept_id: string | null; dept_name: string | null
    func_id: string | null; func_name: string | null
    hall_id: string | null; hall_name: string | null
  }>(
    `SELECT u.id, u.employee_id, u.email, u.full_name,
       p.id AS plant_id, p.name AS plant_name, p.code AS plant_code,
       z.id AS zone_id, z.name AS zone_name,
       d.id AS dept_id, d.name AS dept_name,
       f.id AS func_id, f.name AS func_name,
       h.id AS hall_id, h.name AS hall_name
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN plants p ON p.id = ur.plant_id
     LEFT JOIN zones z ON z.id = ur.zone_id
     LEFT JOIN departments d ON d.id = ur.department_id
     LEFT JOIN functions f ON f.id = ur.function_id
     LEFT JOIN halls h ON h.id = ur.hall_id
     WHERE u.id = $1
     ORDER BY ur.granted_at ASC
     LIMIT 1`,
    [userId],
  )
  const row = res.rows[0]
  if (!row) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'User not found')

  return {
    id: row.id,
    employee_id: row.employee_id,
    email: row.email,
    full_name: row.full_name,
    home_plant: row.plant_id ? { id: row.plant_id, name: row.plant_name!, code: row.plant_code! } : null,
    home_zone: row.zone_id ? { id: row.zone_id, name: row.zone_name! } : null,
    home_department: row.dept_id ? { id: row.dept_id, name: row.dept_name! } : null,
    home_function: row.func_id ? { id: row.func_id, name: row.func_name! } : null,
    home_hall: row.hall_id ? { id: row.hall_id, name: row.hall_name! } : null,
  }
}

export async function listUsers(
  pagination: ParsedPagination,
  search?: string,
): Promise<{ rows: UserRecord[]; total: number }> {
  const params: unknown[] = []
  let where = ''

  if (search) {
    params.push(`%${search}%`)
    where = `WHERE (full_name ILIKE $1 OR email ILIKE $1)`
  }

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM users ${where}`,
    params,
  )
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10)

  const offsetIdx = params.length + 1
  const limitIdx = params.length + 2
  params.push(pagination.offset, pagination.pageSize)

  const rows = await pool.query<UserRecord>(
    `SELECT id, employee_id, email, full_name, phone, is_active, created_at, updated_at
     FROM users ${where}
     ORDER BY created_at DESC
     OFFSET $${offsetIdx} LIMIT $${limitIdx}`,
    params,
  )

  return { rows: rows.rows, total }
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE employee_id = $1 OR email = $2 LIMIT 1`,
    [input.employee_id, input.email],
  )
  if (existing.rows.length > 0) {
    throw new ServiceError(409, ErrorCodes.CONFLICT, 'A user with this employee ID or email already exists')
  }

  const passwordHash = await hashPassword(input.password)

  const insertResult = await pool.query<UserRecord>(
    `INSERT INTO users (employee_id, email, full_name, phone, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING id, employee_id, email, full_name, phone, is_active, created_at, updated_at`,
    [input.employee_id, input.email, input.full_name, input.phone ?? null, passwordHash],
  )

  const user = insertResult.rows[0]
  if (!user) throw new ServiceError(500, ErrorCodes.INTERNAL_ERROR, 'User creation failed')

  if (input.role_id && input.plant_id) {
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, plant_id, granted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [user.id, input.role_id, input.plant_id, input.granted_by],
    )
  }

  return user
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
  const fields: string[] = []
  const params: unknown[] = []

  if (input.full_name !== undefined) {
    params.push(input.full_name)
    fields.push(`full_name = $${params.length}`)
  }
  if (input.phone !== undefined) {
    params.push(input.phone)
    fields.push(`phone = $${params.length}`)
  }
  if (input.email !== undefined) {
    params.push(input.email)
    fields.push(`email = $${params.length}`)
  }

  if (fields.length === 0) {
    throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'No fields to update')
  }

  params.push(id)
  const result = await pool.query<UserRecord>(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length}
     RETURNING id, employee_id, email, full_name, phone, is_active, created_at, updated_at`,
    params,
  )

  const user = result.rows[0]
  if (!user) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'User not found')
  return user
}

export async function deactivateUser(id: string): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `UPDATE users SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, employee_id, email, full_name, phone, is_active, created_at, updated_at`,
    [id],
  )
  const user = result.rows[0]
  if (!user) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'User not found')
  return user
}

export async function assignRole(
  userId: string,
  roleId: string,
  plantId: string,
  grantedBy: string,
): Promise<void> {
  const userCheck = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE id = $1`,
    [userId],
  )
  if (userCheck.rows.length === 0) {
    throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'User not found')
  }

  await pool.query(
    `INSERT INTO user_roles (user_id, role_id, plant_id, granted_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, role_id, plant_id) DO NOTHING`,
    [userId, roleId, plantId, grantedBy],
  )
}

export async function revokeRole(userId: string, roleId: string): Promise<void> {
  const result = await pool.query(
    `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`,
    [userId, roleId],
  )
  if ((result.rowCount ?? 0) === 0) {
    throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Role assignment not found')
  }
}

export async function listRoles(): Promise<RoleRecord[]> {
  const result = await pool.query<RoleRecord>(
    `SELECT id, name, description, is_active FROM roles WHERE is_active = TRUE ORDER BY name`,
  )
  return result.rows
}

export async function listPermissions(): Promise<PermissionRecord[]> {
  const result = await pool.query<PermissionRecord>(
    `SELECT id, code, description FROM permissions ORDER BY code`,
  )
  return result.rows
}
