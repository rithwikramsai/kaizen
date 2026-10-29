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
