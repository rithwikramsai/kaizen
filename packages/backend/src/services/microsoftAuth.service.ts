import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import type { Permission } from '@kiet/shared'
import {
  loadUserPermissions,
  getPrimaryPlantId,
  signAccessToken,
  storeRefreshToken,
} from './auth.service.js'

interface MicrosoftTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
}

interface MicrosoftGraphUser {
  id: string
  displayName: string
  mail: string | null
  userPrincipalName: string
}

export function getMicrosoftAuthUrl(state?: string): string {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI } = env
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_TENANT_ID || !MICROSOFT_REDIRECT_URI) {
    throw new ServiceError(501, ErrorCodes.INTERNAL_ERROR, 'Microsoft SSO is not configured on this server')
  }
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MICROSOFT_REDIRECT_URI,
    scope: 'openid email profile User.Read',
    response_mode: 'query',
    ...(state ? { state } : {}),
  })
  return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`
}

async function exchangeCodeForTokens(code: string): Promise<MicrosoftTokenResponse> {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, MICROSOFT_REDIRECT_URI } = env
  const body = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID!,
    client_secret: MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: MICROSOFT_REDIRECT_URI!,
    grant_type: 'authorization_code',
  })
  const res = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new ServiceError(502, ErrorCodes.INTERNAL_ERROR, `Microsoft token exchange failed: ${text}`)
  }
  return res.json() as Promise<MicrosoftTokenResponse>
}

async function getMicrosoftUserProfile(msAccessToken: string): Promise<MicrosoftGraphUser> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${msAccessToken}` },
  })
  if (!res.ok) {
    throw new ServiceError(502, ErrorCodes.INTERNAL_ERROR, 'Failed to retrieve Microsoft user profile')
  }
  return res.json() as Promise<MicrosoftGraphUser>
}

export interface MicrosoftLoginResult {
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

export async function loginWithMicrosoft(code: string): Promise<MicrosoftLoginResult> {
  const msTokens = await exchangeCodeForTokens(code)
  const msUser = await getMicrosoftUserProfile(msTokens.access_token)

  const email = msUser.mail ?? msUser.userPrincipalName
  if (!email) {
    throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Microsoft account has no email address')
  }

  const userResult = await pool.query<{
    id: string; email: string; full_name: string; is_active: boolean
  }>(
    `SELECT id, email, full_name, is_active FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  )
  const user = userResult.rows[0]

  if (!user) {
    throw new ServiceError(
      403,
      ErrorCodes.FORBIDDEN,
      'No KIET account found for this Microsoft email. Contact your administrator to get access.',
    )
  }
  if (!user.is_active) {
    throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Your KIET account is inactive. Contact your administrator.')
  }

  const [permissions, plantId] = await Promise.all([
    loadUserPermissions(user.id),
    getPrimaryPlantId(user.id),
  ])

  const accessToken = signAccessToken(user.id, user.email, user.full_name, plantId, permissions)
  const refreshToken = await storeRefreshToken(user.id)

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 86400,
    user: { id: user.id, full_name: user.full_name, email: user.email, plant_id: plantId, permissions },
  }
}
