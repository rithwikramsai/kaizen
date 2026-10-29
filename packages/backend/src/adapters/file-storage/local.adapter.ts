import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { env } from '../../config/env.js'
import type { FileStorageAdapter, StoredFile } from './index.js'

export class LocalFileStorageAdapter implements FileStorageAdapter {
  private readonly basePath: string

  constructor() {
    this.basePath = env.FILE_STORAGE_LOCAL_PATH
  }

  async store(file: Express.Multer.File): Promise<StoredFile> {
    await fs.mkdir(this.basePath, { recursive: true })

    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex')
    const ext = path.extname(file.originalname)
    const filename = `${checksum}${ext}`
    const filePath = path.join(this.basePath, filename)

    await fs.writeFile(filePath, file.buffer)

    return { path: filePath, checksum }
  }

  getUrl(filePath: string): string {
    return `/files/${path.basename(filePath)}`
  }

  async delete(filePath: string): Promise<void> {
    await fs.unlink(filePath)
  }
}
