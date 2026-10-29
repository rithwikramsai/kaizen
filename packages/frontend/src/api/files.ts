/// <reference types="vite/client" />

const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

export interface UploadedFile {
  file_id: string
  file_name: string
  file_size: number
  content_type: string
}

export async function uploadFile(file: File, entityType: string, token: string): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  form.append('entity_type', entityType)

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  const body = (await res.json()) as
    | { success: true; data: UploadedFile }
    | { success: false; error: { message: string } }

  if (!res.ok || !body.success) {
    const msg = !body.success ? body.error.message : `Upload failed (${res.status})`
    throw new Error(msg)
  }

  return (body as { success: true; data: UploadedFile }).data
}
