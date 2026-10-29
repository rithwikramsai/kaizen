/// <reference types="vite/client" />

const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const body = await res.json() as T
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${JSON.stringify(body)}`)
  }
  return body
}
