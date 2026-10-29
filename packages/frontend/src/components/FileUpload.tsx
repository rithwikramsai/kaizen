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
}

export function FileUpload({ onFileUploaded, onFileRemoved, entityType }: Props) {
  const { token } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<UploadedItem[]>([])
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
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-slate-50'
        }`}
      >
        {uploading ? (
          <p className="text-sm text-indigo-600">Uploading…</p>
        ) : (
          <p className="text-sm text-slate-500">
            Drag & drop files here, or <span className="text-indigo-600 font-medium">click to browse</span>
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      {uploaded.length > 0 && (
        <ul className="space-y-1">
          {uploaded.map((f) => (
            <li key={f.fileId} className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-md text-sm">
              <span className="text-slate-700 truncate">{f.fileName}</span>
              <button
                type="button"
                onClick={() => remove(f.fileId)}
                className="ml-2 text-slate-400 hover:text-red-500 flex-shrink-0"
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
