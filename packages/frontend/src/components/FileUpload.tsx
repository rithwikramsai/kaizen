import { useRef, useState } from 'react'
import { uploadFile } from '../api/files.js'
import { useAuth } from '../hooks/useAuth.js'

interface UploadedItem {
  fileId: string
  fileName: string
}

interface Props {
  onFileUploaded: (fileId: string, fileName: string) => void
  onFileRemoved: (fileId: string) => void
  entityType: string
  /** Pre-existing files to show on mount (e.g. loaded from DB). Pass with a stable key so the component remounts when the entity changes. */
  initialFiles?: { fileId: string; fileName: string }[]
}

export function FileUpload({ onFileUploaded, onFileRemoved, entityType, initialFiles }: Props) {
  const { token } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<UploadedItem[]>(() =>
    (initialFiles ?? []).map((f) => ({ fileId: f.fileId, fileName: f.fileName })),
  )
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const result = await uploadFile(file, entityType, token ?? '')
        setUploaded((prev) => [...prev, { fileId: result.file_id, fileName: result.file_name }])
        onFileUploaded(result.file_id, result.file_name)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const remove = (fileId: string) => {
    setUploaded((prev) => prev.filter((f) => f.fileId !== fileId))
    onFileRemoved(fileId)
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/5'
        }`}
      >
        {uploading ? (
          <p className="text-sm text-indigo-400">Uploading…</p>
        ) : (
          <p className="text-sm text-slate-500">
            Drag & drop files here, or <span className="text-indigo-400 font-medium">click to browse</span>
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}

      {uploaded.length > 0 && (
        <ul className="space-y-1">
          {uploaded.map((f) => (
            <li key={f.fileId} className="flex items-center justify-between bg-white/5 border border-white/8 px-3 py-2 rounded-xl text-sm">
              <span className="text-slate-300 truncate">{f.fileName}</span>
              <button
                type="button"
                onClick={() => remove(f.fileId)}
                className="ml-2 text-slate-500 hover:text-red-400 flex-shrink-0 transition-colors"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
