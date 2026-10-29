import type { PaginationMeta } from '@kiet/shared'

export interface ParsedPagination {
  page: number
  pageSize: number
  offset: number
  sortBy: string
  sortDir: 'ASC' | 'DESC'
}

export function parsePagination(
  query: Record<string, unknown>,
  defaultSortBy = 'created_at',
): ParsedPagination {
  const page = Math.max(1, parseInt(String(query['page'] ?? '1'), 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query['page_size'] ?? '20'), 10) || 20))
  const sortDir = String(query['sort_dir'] ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
  const sortBy = String(query['sort_by'] ?? defaultSortBy)
  return { page, pageSize, offset: (page - 1) * pageSize, sortBy, sortDir }
}

export function buildMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, page_size: pageSize, total }
}
