import jwt from 'jsonwebtoken'
import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { verifyPassword, hashToken, generateToken } from '../utils/hash.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import type { Permission } from '@kiet/shared'

interface UserRow {
  id: string
  email: string
  full_name: string
  password_hash: string | null
  is_active: boolean
}

interface UserRoleRow {
  plant_id: string
}

interface LoginResult {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: string
    full_name: string
    email: string
    plant_id: string
    permissions: Permission[]
  }
}

async function loadUserPermissions(userId: string): Promise<Permission[]> {
  const result = await pool.query<{ code: string }>(
    `SELECT DISTINCT p.code
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = $1`,
    [userId],
  )
  return result.rows.map((r) => r.code as Permission)
}

async function getPrimaryPlantId(userId: string): Promise<string> {
  const result = await pool.query<UserRoleRow>(
    `SELECT plant_id FROM user_roles WHERE user_id = $1 ORDER BY granted_at ASC LIMIT 1`,
    [userId],
  )
  return result.rows[0]?.plant_id ?? ''
}

function signAccessToken(
  userId: string,
  email: string,
  plantId: string,
  permissions: Permission[],
): string {
  return jwt.sign(
    { sub: userId, email, plant_id: plantId, permissions },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
  )
}

async function storeRefreshToken(userId: string): Promise<string> {
  const raw = generateToken()
  const hash = hashToken(raw)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, hash, expiresAt],
  )
  return raw
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const userResult = await pool.query<UserRow>(
    `SELECT id, email, full_name, password_hash, is_active FROM users WHERE email = $1`,
    [email],
  )
  const user = userResult.rows[0]

  if (!user || !user.is_active) {
    throw new ServiceError(401, ErrorCodes.UNAUTHENTICATED, 'Invalid email or password')
  }

  if (!user.password_hash) {
    throw new ServiceError(401, ErrorCodes.UNAUTHENTICATED, 'Account not configured for password login')
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    throw new ServiceError(401, ErrorCodes.UNAUTHENTICATED, 'Invalid email or password')
  }

  const [permissions, plantId] = await Promise.all([
    loadUserPermissions(user.id),
    getPrimaryPlantId(user.id),
  ])

  const accessToken = signAccessToken(user.id, user.email, plantId, permissions)
  const refreshToken = await storeRefreshToken(user.id)

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 86400,
    user: { id: user.id, full_name: user.full_name, email: user.email, plant_id: plantId, permissions },
  }
}

export async function refresh(rawRefreshToken: string): Promise<LoginResult> {
  const hash = hashToken(rawRefreshToken)

  const tokenResult = await pool.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [hash],
  )
  const tokenRow = tokenResult.rows[0]
  if (!tokenRow) {
    throw new ServiceError(401, ErrorCodes.UNAUTHENTICATED, 'Invalid or expired refresh token')
  }

  const userResult = await pool.query<UserRow>(
    `SELECT id, email, full_name, is_active FROM users WHERE id = $1`,
    [tokenRow.user_id],
  )
  const user = userResult.rows[0]
  if (!user || !user.is_active) {
    throw new ServiceError(401, ErrorCodes.UNAUTHENTICATED, 'User account is inactive')
  }

  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
    [tokenRow.id],
  )

  const [permissions, plantId] = await Promise.all([
    loadUserPermissions(user.id),
    getPrimaryPlantId(user.id),
  ])

  const accessToken = signAccessToken(user.id, user.email, plantId, permissions)
  const newRefreshToken = await storeRefreshToken(user.id)

  return {
    access_token: accessToken,
    refresh_token: newRefreshToken,
    expires_in: 86400,
    user: { id: user.id, full_name: user.full_name, email: user.email, plant_id: plantId, permissions },
  }
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const hash = hashToken(rawRefreshToken)
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hash],
  )
}
