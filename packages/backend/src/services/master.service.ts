import { pool } from '../config/database.js'
import type { QueryResultRow } from 'pg'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import type { ParsedPagination } from '../utils/pagination.js'

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function paginatedList<T extends QueryResultRow>(
  table: string,
  columns: string,
  pagination: ParsedPagination,
  where = '',
  params: unknown[] = [],
): Promise<{ rows: T[]; total: number }> {
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ${table} ${where}`,
    params,
  )
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10)

  const offsetIdx = params.length + 1
  const limitIdx = params.length + 2
  const rowResult = await pool.query<T>(
    `SELECT ${columns} FROM ${table} ${where}
     ORDER BY created_at DESC OFFSET $${offsetIdx} LIMIT $${limitIdx}`,
    [...params, pagination.offset, pagination.pageSize],
  )
  return { rows: rowResult.rows, total }
}

async function softDelete(table: string, id: string): Promise<void> {
  const result = await pool.query(
    `UPDATE ${table} SET is_active = FALSE WHERE id = $1`,
    [id],
  )
  if ((result.rowCount ?? 0) === 0) {
    throw new ServiceError(404, ErrorCodes.NOT_FOUND, `${table} record not found`)
  }
}

// ─── Plants ───────────────────────────────────────────────────────────────────

export interface PlantRow {
  id: string
  name: string
  code: string
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function listPlants(
  pagination: ParsedPagination,
): Promise<{ rows: PlantRow[]; total: number }> {
  return paginatedList<PlantRow>(
    'plants',
    'id, name, code, address, is_active, created_at, updated_at',
    pagination,
    'WHERE is_active = TRUE',
  )
}

export async function createPlant(data: {
  name: string
  code: string
  address?: string | undefined
}): Promise<PlantRow> {
  try {
    const result = await pool.query<PlantRow>(
      `INSERT INTO plants (name, code, address) VALUES ($1, $2, $3)
       RETURNING id, name, code, address, is_active, created_at, updated_at`,
      [data.name, data.code, data.address ?? null],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Plant code already exists')
    throw err
  }
}

export async function updatePlant(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; address?: string | undefined; is_active?: boolean | undefined },
): Promise<PlantRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<PlantRow>(
    `UPDATE plants SET ${sql} WHERE id = $${params.length}
     RETURNING id, name, code, address, is_active, created_at, updated_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Plant not found')
  return result.rows[0]
}

export async function deletePlant(id: string): Promise<void> {
  return softDelete('plants', id)
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export interface ZoneRow {
  id: string
  plant_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export async function listZones(plantId?: string): Promise<ZoneRow[]> {
  if (plantId) {
    const result = await pool.query<ZoneRow>(
      `SELECT id, plant_id, name, code, is_active, created_at FROM zones
       WHERE plant_id = $1 AND is_active = TRUE ORDER BY name`,
      [plantId],
    )
    return result.rows
  }
  const result = await pool.query<ZoneRow>(
    `SELECT id, plant_id, name, code, is_active, created_at FROM zones WHERE is_active = TRUE ORDER BY name`,
  )
  return result.rows
}

export async function createZone(data: {
  name: string
  code: string
  plant_id: string
}): Promise<ZoneRow> {
  try {
    const result = await pool.query<ZoneRow>(
      `INSERT INTO zones (name, code, plant_id) VALUES ($1, $2, $3)
       RETURNING id, plant_id, name, code, is_active, created_at`,
      [data.name, data.code, data.plant_id],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Zone code already exists in this plant')
    throw err
  }
}

export async function updateZone(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; is_active?: boolean | undefined },
): Promise<ZoneRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<ZoneRow>(
    `UPDATE zones SET ${sql} WHERE id = $${params.length}
     RETURNING id, plant_id, name, code, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Zone not found')
  return result.rows[0]
}

export async function deleteZone(id: string): Promise<void> {
  return softDelete('zones', id)
}

// ─── Departments ──────────────────────────────────────────────────────────────

export interface DepartmentRow {
  id: string
  plant_id: string
  zone_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export async function listDepartments(zoneId?: string): Promise<DepartmentRow[]> {
  if (zoneId) {
    const result = await pool.query<DepartmentRow>(
      `SELECT id, plant_id, zone_id, name, code, is_active, created_at FROM departments
       WHERE zone_id = $1 AND is_active = TRUE ORDER BY name`,
      [zoneId],
    )
    return result.rows
  }
  const result = await pool.query<DepartmentRow>(
    `SELECT id, plant_id, zone_id, name, code, is_active, created_at FROM departments
     WHERE is_active = TRUE ORDER BY name`,
  )
  return result.rows
}

export async function createDepartment(data: {
  name: string
  code: string
  plant_id: string
  zone_id: string
}): Promise<DepartmentRow> {
  try {
    const result = await pool.query<DepartmentRow>(
      `INSERT INTO departments (name, code, plant_id, zone_id) VALUES ($1, $2, $3, $4)
       RETURNING id, plant_id, zone_id, name, code, is_active, created_at`,
      [data.name, data.code, data.plant_id, data.zone_id],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Department code already exists')
    throw err
  }
}

export async function updateDepartment(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; is_active?: boolean | undefined },
): Promise<DepartmentRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<DepartmentRow>(
    `UPDATE departments SET ${sql} WHERE id = $${params.length}
     RETURNING id, plant_id, zone_id, name, code, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Department not found')
  return result.rows[0]
}

export async function deleteDepartment(id: string): Promise<void> {
  return softDelete('departments', id)
}

// ─── Functions ────────────────────────────────────────────────────────────────

export interface FunctionRow {
  id: string
  dept_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export async function listFunctions(deptId?: string): Promise<FunctionRow[]> {
  if (deptId) {
    const result = await pool.query<FunctionRow>(
      `SELECT id, dept_id, name, code, is_active, created_at FROM functions
       WHERE dept_id = $1 AND is_active = TRUE ORDER BY name`,
      [deptId],
    )
    return result.rows
  }
  const result = await pool.query<FunctionRow>(
    `SELECT id, dept_id, name, code, is_active, created_at FROM functions
     WHERE is_active = TRUE ORDER BY name`,
  )
  return result.rows
}

export async function createFunction(data: {
  name: string
  code: string
  dept_id: string
}): Promise<FunctionRow> {
  try {
    const result = await pool.query<FunctionRow>(
      `INSERT INTO functions (name, code, dept_id) VALUES ($1, $2, $3)
       RETURNING id, dept_id, name, code, is_active, created_at`,
      [data.name, data.code, data.dept_id],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Function code already exists')
    throw err
  }
}

export async function updateFunction(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; is_active?: boolean | undefined },
): Promise<FunctionRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<FunctionRow>(
    `UPDATE functions SET ${sql} WHERE id = $${params.length}
     RETURNING id, dept_id, name, code, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Function not found')
  return result.rows[0]
}

export async function deleteFunction(id: string): Promise<void> {
  return softDelete('functions', id)
}

// ─── Halls ────────────────────────────────────────────────────────────────────

export interface HallRow {
  id: string
  func_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export async function listHalls(funcId?: string): Promise<HallRow[]> {
  if (funcId) {
    const result = await pool.query<HallRow>(
      `SELECT id, func_id, name, code, is_active, created_at FROM halls
       WHERE func_id = $1 AND is_active = TRUE ORDER BY name`,
      [funcId],
    )
    return result.rows
  }
  const result = await pool.query<HallRow>(
    `SELECT id, func_id, name, code, is_active, created_at FROM halls
     WHERE is_active = TRUE ORDER BY name`,
  )
  return result.rows
}

export async function createHall(data: {
  name: string
  code: string
  func_id: string
}): Promise<HallRow> {
  try {
    const result = await pool.query<HallRow>(
      `INSERT INTO halls (name, code, func_id) VALUES ($1, $2, $3)
       RETURNING id, func_id, name, code, is_active, created_at`,
      [data.name, data.code, data.func_id],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Hall code already exists')
    throw err
  }
}

export async function updateHall(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; is_active?: boolean | undefined },
): Promise<HallRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<HallRow>(
    `UPDATE halls SET ${sql} WHERE id = $${params.length}
     RETURNING id, func_id, name, code, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Hall not found')
  return result.rows[0]
}

export async function deleteHall(id: string): Promise<void> {
  return softDelete('halls', id)
}

// ─── Locations ────────────────────────────────────────────────────────────────

export interface LocationRow {
  id: string
  hall_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export async function listLocations(hallId?: string): Promise<LocationRow[]> {
  if (hallId) {
    const result = await pool.query<LocationRow>(
      `SELECT id, hall_id, name, code, is_active, created_at FROM locations
       WHERE hall_id = $1 AND is_active = TRUE ORDER BY name`,
      [hallId],
    )
    return result.rows
  }
  const result = await pool.query<LocationRow>(
    `SELECT id, hall_id, name, code, is_active, created_at FROM locations
     WHERE is_active = TRUE ORDER BY name`,
  )
  return result.rows
}

export async function createLocation(data: {
  name: string
  code: string
  hall_id: string
}): Promise<LocationRow> {
  try {
    const result = await pool.query<LocationRow>(
      `INSERT INTO locations (name, code, hall_id) VALUES ($1, $2, $3)
       RETURNING id, hall_id, name, code, is_active, created_at`,
      [data.name, data.code, data.hall_id],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Location code already exists')
    throw err
  }
}

export async function updateLocation(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; is_active?: boolean | undefined },
): Promise<LocationRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<LocationRow>(
    `UPDATE locations SET ${sql} WHERE id = $${params.length}
     RETURNING id, hall_id, name, code, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Location not found')
  return result.rows[0]
}

export async function deleteLocation(id: string): Promise<void> {
  return softDelete('locations', id)
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface CategoryRow {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export async function listCategories(
  pagination: ParsedPagination,
): Promise<{ rows: CategoryRow[]; total: number }> {
  return paginatedList<CategoryRow>(
    'categories',
    'id, name, code, is_active, created_at',
    pagination,
    'WHERE is_active = TRUE',
  )
}

export async function createCategory(data: { name: string; code: string }): Promise<CategoryRow> {
  try {
    const result = await pool.query<CategoryRow>(
      `INSERT INTO categories (name, code) VALUES ($1, $2)
       RETURNING id, name, code, is_active, created_at`,
      [data.name, data.code],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Category code already exists')
    throw err
  }
}

export async function updateCategory(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; is_active?: boolean | undefined },
): Promise<CategoryRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<CategoryRow>(
    `UPDATE categories SET ${sql} WHERE id = $${params.length}
     RETURNING id, name, code, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Category not found')
  return result.rows[0]
}

export async function deleteCategory(id: string): Promise<void> {
  return softDelete('categories', id)
}

// ─── Sub-categories ───────────────────────────────────────────────────────────

export interface SubCategoryRow {
  id: string
  category_id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
}

export async function listSubCategories(
  pagination: ParsedPagination,
  categoryId?: string,
): Promise<{ rows: SubCategoryRow[]; total: number }> {
  if (categoryId) {
    return paginatedList<SubCategoryRow>(
      'sub_categories',
      'id, category_id, name, code, is_active, created_at',
      pagination,
      'WHERE is_active = TRUE AND category_id = $1',
      [categoryId],
    )
  }
  return paginatedList<SubCategoryRow>(
    'sub_categories',
    'id, category_id, name, code, is_active, created_at',
    pagination,
    'WHERE is_active = TRUE',
  )
}

export async function createSubCategory(data: {
  name: string
  code: string
  category_id: string
}): Promise<SubCategoryRow> {
  try {
    const result = await pool.query<SubCategoryRow>(
      `INSERT INTO sub_categories (name, code, category_id) VALUES ($1, $2, $3)
       RETURNING id, category_id, name, code, is_active, created_at`,
      [data.name, data.code, data.category_id],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Sub-category code already exists')
    throw err
  }
}

export async function updateSubCategory(
  id: string,
  data: { name?: string | undefined; code?: string | undefined; is_active?: boolean | undefined },
): Promise<SubCategoryRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<SubCategoryRow>(
    `UPDATE sub_categories SET ${sql} WHERE id = $${params.length}
     RETURNING id, category_id, name, code, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Sub-category not found')
  return result.rows[0]
}

export async function deleteSubCategory(id: string): Promise<void> {
  return softDelete('sub_categories', id)
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export interface TagRow {
  id: string
  name: string
  color: string | null
  is_active: boolean
  created_at: string
}

export async function listTags(
  pagination: ParsedPagination,
): Promise<{ rows: TagRow[]; total: number }> {
  return paginatedList<TagRow>(
    'tags',
    'id, name, color, is_active, created_at',
    pagination,
    'WHERE is_active = TRUE',
  )
}

export async function createTag(data: { name: string; color?: string | undefined }): Promise<TagRow> {
  try {
    const result = await pool.query<TagRow>(
      `INSERT INTO tags (name, color) VALUES ($1, $2)
       RETURNING id, name, color, is_active, created_at`,
      [data.name, data.color ?? null],
    )
    return result.rows[0]!
  } catch (err: unknown) {
    if (isUniqueViolation(err)) throw new ServiceError(409, ErrorCodes.CONFLICT, 'Tag name already exists')
    throw err
  }
}

export async function updateTag(
  id: string,
  data: { name?: string | undefined; color?: string | undefined; is_active?: boolean | undefined },
): Promise<TagRow> {
  const { sql, params } = buildUpdateClause(data, id)
  const result = await pool.query<TagRow>(
    `UPDATE tags SET ${sql} WHERE id = $${params.length}
     RETURNING id, name, color, is_active, created_at`,
    params,
  )
  if (!result.rows[0]) throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Tag not found')
  return result.rows[0]
}

export async function deleteTag(id: string): Promise<void> {
  return softDelete('tags', id)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  )
}

function buildUpdateClause(
  data: Record<string, unknown>,
  id: string,
): { sql: string; params: unknown[] } {
  const params: unknown[] = []
  const fields: string[] = []

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      params.push(val)
      fields.push(`${key} = $${params.length}`)
    }
  }

  if (fields.length === 0) {
    throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'No fields to update')
  }

  params.push(id)
  return { sql: fields.join(', '), params }
}
