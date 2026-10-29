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

  return body as T
}
