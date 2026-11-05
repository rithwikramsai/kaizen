import { parsePagination, buildMeta } from '../utils/pagination.js'

describe('parsePagination', () => {
  it('returns defaults when query is empty', () => {
    const p = parsePagination({})
    expect(p.page).toBe(1)
    expect(p.pageSize).toBe(20)
    expect(p.offset).toBe(0)
    expect(p.sortDir).toBe('DESC')
  })

  it('parses page and page_size correctly', () => {
    const p = parsePagination({ page: '3', page_size: '50' })
    expect(p.page).toBe(3)
    expect(p.pageSize).toBe(50)
    expect(p.offset).toBe(100)
  })

  it('clamps page_size to max 100', () => {
    const p = parsePagination({ page_size: '500' })
    expect(p.pageSize).toBe(100)
  })

  it('clamps page to min 1 for invalid input', () => {
    const p = parsePagination({ page: '-5' })
    expect(p.page).toBe(1)
  })

  it('defaults to page 1 for non-numeric page', () => {
    const p = parsePagination({ page: 'abc' })
    expect(p.page).toBe(1)
  })

  it('parses sort_dir ASC correctly', () => {
    const p = parsePagination({ sort_dir: 'asc' })
    expect(p.sortDir).toBe('ASC')
  })

  it('uses custom defaultSortBy when provided', () => {
    const p = parsePagination({}, 'updated_at')
    expect(p.sortBy).toBe('updated_at')
  })

  it('respects sort_by query param', () => {
    const p = parsePagination({ sort_by: 'email' })
    expect(p.sortBy).toBe('email')
  })
})

describe('buildMeta', () => {
  it('returns page, page_size, and total unchanged', () => {
    const meta = buildMeta(2, 25, 100)
    expect(meta.page).toBe(2)
    expect(meta.page_size).toBe(25)
    expect(meta.total).toBe(100)
  })

  it('works with page 1 and total 0', () => {
    const meta = buildMeta(1, 20, 0)
    expect(meta.total).toBe(0)
    expect(meta.page).toBe(1)
  })
})
