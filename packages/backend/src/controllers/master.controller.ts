import type { Request, Response } from 'express'
import { z } from 'zod'
import * as master from '../services/master.service.js'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import { parsePagination, buildMeta } from '../utils/pagination.js'

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
    return
  }
  console.error('[master]', err)
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred')
}

function validationError(res: Response, err: z.ZodError): void {
  const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
  sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', details)
}

// ─── Org hierarchy (read-only) ────────────────────────────────────────────────

export async function getPlants(_req: Request, res: Response): Promise<void> {
  try {
    const result = await master.listZones() // reuse type-safe read
    void result
    const plants = await master.listPlants(parsePagination({}))
    sendSuccess(res, plants.rows)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getOrgPlants(_req: Request, res: Response): Promise<void> {
  try {
    const pagination = parsePagination({}, 'name')
    const { rows } = await master.listPlants(pagination)
    sendSuccess(res, rows)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getOrgZones(req: Request, res: Response): Promise<void> {
  try {
    const rows = await master.listZones(req.params['plant_id'])
    sendSuccess(res, rows)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getOrgDepartments(req: Request, res: Response): Promise<void> {
  try {
    const rows = await master.listDepartments(req.params['zone_id'])
    sendSuccess(res, rows)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getOrgFunctions(req: Request, res: Response): Promise<void> {
  try {
    const rows = await master.listFunctions(req.params['dept_id'])
    sendSuccess(res, rows)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getOrgHalls(req: Request, res: Response): Promise<void> {
  try {
    const rows = await master.listHalls(req.params['func_id'])
    sendSuccess(res, rows)
  } catch (err) {
    handleError(res, err)
  }
}

export async function getOrgLocations(req: Request, res: Response): Promise<void> {
  try {
    const rows = await master.listLocations(req.params['hall_id'])
    sendSuccess(res, rows)
  } catch (err) {
    handleError(res, err)
  }
}

// ─── Plants CRUD ─────────────────────────────────────────────────────────────

const plantSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  address: z.string().optional(),
})
const plantUpdateSchema = plantSchema.partial().extend({ is_active: z.boolean().optional() })

export async function listPlants(req: Request, res: Response): Promise<void> {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const { rows, total } = await master.listPlants(pagination)
    sendSuccess(res, rows, 200, buildMeta(pagination.page, pagination.pageSize, total))
  } catch (err) {
    handleError(res, err)
  }
}

export async function createPlant(req: Request, res: Response): Promise<void> {
  const parsed = plantSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createPlant(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updatePlant(req: Request, res: Response): Promise<void> {
  const parsed = plantUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updatePlant(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deletePlant(req: Request, res: Response): Promise<void> {
  try {
    await master.deletePlant(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Zones CRUD ───────────────────────────────────────────────────────────────

const zoneSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  plant_id: z.string().uuid(),
})
const zoneUpdateSchema = zoneSchema.partial().extend({ is_active: z.boolean().optional() })

export async function listZones(req: Request, res: Response): Promise<void> {
  try {
    const plantId = typeof req.query['plant_id'] === 'string' ? req.query['plant_id'] : undefined
    const rows = await master.listZones(plantId)
    sendSuccess(res, rows)
  } catch (err) { handleError(res, err) }
}

export async function createZone(req: Request, res: Response): Promise<void> {
  const parsed = zoneSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createZone(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateZone(req: Request, res: Response): Promise<void> {
  const parsed = zoneUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateZone(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteZone(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteZone(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Departments CRUD ─────────────────────────────────────────────────────────

const deptSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  plant_id: z.string().uuid(),
  zone_id: z.string().uuid(),
})
const deptUpdateSchema = deptSchema.partial().extend({ is_active: z.boolean().optional() })

export async function listDepartments(req: Request, res: Response): Promise<void> {
  try {
    const zoneId = typeof req.query['zone_id'] === 'string' ? req.query['zone_id'] : undefined
    const rows = await master.listDepartments(zoneId)
    sendSuccess(res, rows)
  } catch (err) { handleError(res, err) }
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  const parsed = deptSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createDepartment(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  const parsed = deptUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateDepartment(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteDepartment(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Functions CRUD ───────────────────────────────────────────────────────────

const funcSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  dept_id: z.string().uuid(),
})
const funcUpdateSchema = funcSchema.partial().extend({ is_active: z.boolean().optional() })

export async function listFunctions(req: Request, res: Response): Promise<void> {
  try {
    const deptId = typeof req.query['dept_id'] === 'string' ? req.query['dept_id'] : undefined
    const rows = await master.listFunctions(deptId)
    sendSuccess(res, rows)
  } catch (err) { handleError(res, err) }
}

export async function createFunctionHandler(req: Request, res: Response): Promise<void> {
  const parsed = funcSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createFunction(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateFunctionHandler(req: Request, res: Response): Promise<void> {
  const parsed = funcUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateFunction(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteFunctionHandler(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteFunction(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Halls CRUD ───────────────────────────────────────────────────────────────

const hallSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  func_id: z.string().uuid(),
})
const hallUpdateSchema = hallSchema.partial().extend({ is_active: z.boolean().optional() })

export async function listHalls(req: Request, res: Response): Promise<void> {
  try {
    const funcId = typeof req.query['func_id'] === 'string' ? req.query['func_id'] : undefined
    const rows = await master.listHalls(funcId)
    sendSuccess(res, rows)
  } catch (err) { handleError(res, err) }
}

export async function createHall(req: Request, res: Response): Promise<void> {
  const parsed = hallSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createHall(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateHall(req: Request, res: Response): Promise<void> {
  const parsed = hallUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateHall(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteHall(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteHall(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Locations CRUD ───────────────────────────────────────────────────────────

const locationSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  hall_id: z.string().uuid(),
})
const locationUpdateSchema = locationSchema.partial().extend({ is_active: z.boolean().optional() })

export async function listLocations(req: Request, res: Response): Promise<void> {
  try {
    const hallId = typeof req.query['hall_id'] === 'string' ? req.query['hall_id'] : undefined
    const rows = await master.listLocations(hallId)
    sendSuccess(res, rows)
  } catch (err) { handleError(res, err) }
}

export async function createLocation(req: Request, res: Response): Promise<void> {
  const parsed = locationSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createLocation(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateLocation(req: Request, res: Response): Promise<void> {
  const parsed = locationUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateLocation(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteLocation(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteLocation(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Categories CRUD ──────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
})
const categoryUpdateSchema = categorySchema.partial().extend({ is_active: z.boolean().optional() })

export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const { rows, total } = await master.listCategories(pagination)
    sendSuccess(res, rows, 200, buildMeta(pagination.page, pagination.pageSize, total))
  } catch (err) { handleError(res, err) }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createCategory(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const parsed = categoryUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateCategory(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteCategory(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Sub-categories CRUD ──────────────────────────────────────────────────────

const subCategorySchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  category_id: z.string().uuid(),
})
const subCategoryUpdateSchema = subCategorySchema.partial().extend({ is_active: z.boolean().optional() })

export async function listSubCategories(req: Request, res: Response): Promise<void> {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const categoryId = typeof req.query['category_id'] === 'string' ? req.query['category_id'] : undefined
    const { rows, total } = await master.listSubCategories(pagination, categoryId)
    sendSuccess(res, rows, 200, buildMeta(pagination.page, pagination.pageSize, total))
  } catch (err) { handleError(res, err) }
}

export async function createSubCategory(req: Request, res: Response): Promise<void> {
  const parsed = subCategorySchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createSubCategory(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateSubCategory(req: Request, res: Response): Promise<void> {
  const parsed = subCategoryUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateSubCategory(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteSubCategory(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteSubCategory(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}

// ─── Tags CRUD ────────────────────────────────────────────────────────────────

const tagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})
const tagUpdateSchema = tagSchema.partial().extend({ is_active: z.boolean().optional() })

export async function listTags(req: Request, res: Response): Promise<void> {
  try {
    const pagination = parsePagination(req.query as Record<string, unknown>)
    const { rows, total } = await master.listTags(pagination)
    sendSuccess(res, rows, 200, buildMeta(pagination.page, pagination.pageSize, total))
  } catch (err) { handleError(res, err) }
}

export async function createTag(req: Request, res: Response): Promise<void> {
  const parsed = tagSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.createTag(parsed.data)
    sendSuccess(res, row, 201)
  } catch (err) { handleError(res, err) }
}

export async function updateTag(req: Request, res: Response): Promise<void> {
  const parsed = tagUpdateSchema.safeParse(req.body)
  if (!parsed.success) { validationError(res, parsed.error); return }
  try {
    const row = await master.updateTag(req.params['id']!, parsed.data)
    sendSuccess(res, row)
  } catch (err) { handleError(res, err) }
}

export async function deleteTag(req: Request, res: Response): Promise<void> {
  try {
    await master.deleteTag(req.params['id']!)
    sendSuccess(res, null)
  } catch (err) { handleError(res, err) }
}
