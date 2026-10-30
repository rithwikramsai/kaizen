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
    refresh_token: string
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

export interface MyProfile {
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

export async function getMyProfile(token: string): Promise<MyProfile> {
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = (await res.json()) as { success: true; data: MyProfile } | { success: false; error: { message: string } }
  if (!res.ok || !body.success) {
    throw new Error(!body.success ? body.error.message : 'Failed to load profile')
  }
  return (body as { success: true; data: MyProfile }).data
}

export async function logout(token: string, refreshToken: string): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {
    // best-effort
  })
}
