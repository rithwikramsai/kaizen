import { pool } from '../config/database.js'
import { LocalFileStorageAdapter } from '../adapters/file-storage/local.adapter.js'

const storageAdapter = new LocalFileStorageAdapter()

export async function uploadFile(
  file: Express.Multer.File,
  _entityType: string,
  uploadedBy: string,
): Promise<{ file_id: string; file_name: string; file_size: number; content_type: string }> {
  const stored = await storageAdapter.store(file)

  const res = await pool.query<{ id: string }>(
    `INSERT INTO file_metadata
       (file_name, file_path, file_size, content_type, uploaded_by, uploaded_at, storage_backend, checksum)
     VALUES ($1, $2, $3, $4, $5, NOW(), 'local', $6)
     RETURNING id`,
    [file.originalname, stored.path, file.size, file.mimetype, uploadedBy, stored.checksum],
  )

  return {
    file_id: res.rows[0]!.id,
    file_name: file.originalname,
    file_size: file.size,
    content_type: file.mimetype,
  }
}
