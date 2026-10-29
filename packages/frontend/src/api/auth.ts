/// <reference types="vite/client" />

const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

export interface AuthUser {
  id: string
  full_name: string
  email: string
  plant_id: string
  permissions: string[]
}

export interface LoginResponse {
  success: true
  data: {
    access_token: string
    expires_in: number
    user: AuthUser
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = (await res.json()) as LoginResponse | { success: false; error: { message: string } }
  if (!res.ok || !body.success) {
    const msg = !body.success ? body.error.message : `Login failed (${res.status})`
    throw new Error(msg)
  }
  return body as LoginResponse
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    // best-effort
  })
}
