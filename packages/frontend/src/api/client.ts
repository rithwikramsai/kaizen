const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

const TOKEN_KEY = 'kiet_access_token'

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

  const body = (await res.json()) as { success: boolean; data?: T; error?: { code: string; message: string } }

  if (!res.ok) {
    const msg = body.error?.message ?? `Request failed with status ${res.status}`
    throw new Error(msg)
  }

  return body.data as T
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
