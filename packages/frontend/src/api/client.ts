export const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

export const TOKEN_KEY = 'kiet_access_token'
const REFRESH_KEY = 'kiet_refresh_token'
const USER_KEY = 'kiet_user'

function handle401(): never {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  window.location.replace('/login')
  throw new Error('Session expired')
}

export async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) handle401()

  const body = (await res.json()) as { success: boolean; data?: T; error?: { code: string; message: string } }

  if (!res.ok) {
    const msg = body.error?.message ?? `Request failed with status ${res.status}`
    throw new Error(msg)
  }

  return body.data as T
}

// For paginated endpoints that return both data[] and meta alongside
export async function authFetchPaginated<T>(
  path: string,
): Promise<{ data: T[]; meta: { page: number; page_size: number; total: number } }> {
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.status === 401) handle401()

  const body = (await res.json()) as {
    success: boolean
    data?: T[]
    meta?: { page: number; page_size: number; total: number }
    error?: { code: string; message: string }
  }

  if (!res.ok) {
    const msg = body.error?.message ?? `Request failed with status ${res.status}`
    throw new Error(msg)
  }

  return {
    data: body.data ?? [],
    meta: body.meta ?? { page: 1, page_size: 12, total: 0 },
  }
}

export async function authFetchList<T>(path: string): Promise<{ rows: T[]; total: number }> {
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const body = (await res.json()) as {
    success: boolean
    data?: T[]
    meta?: { total: number }
    error?: { code: string; message: string }
  }

  if (!res.ok) {
    const msg = body.error?.message ?? `Request failed with status ${res.status}`
    throw new Error(msg)
  }

  const rows = body.data ?? []
  const total = body.meta?.total ?? rows.length
  return { rows, total }
}
