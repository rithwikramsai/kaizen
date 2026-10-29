export interface StoredFile {
  path: string
  checksum: string
}

export interface FileStorageAdapter {
  store(file: Express.Multer.File): Promise<StoredFile>
  getUrl(path: string): string
  delete(path: string): Promise<void>
}
