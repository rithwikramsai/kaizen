import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import * as m from '../controllers/master.controller.js'

const router: ReturnType<typeof Router> = Router()

const authOnly = [authenticate]
const canManage = [authenticate, requirePermission('CAN_MANAGE_MASTER_DATA')]

// ─── Org hierarchy (read-only, nested) ───────────────────────────────────────
router.get('/org/plants', ...authOnly, m.getOrgPlants)
router.get('/org/plants/:plant_id/zones', ...authOnly, m.getOrgZones)
router.get('/org/zones/:zone_id/departments', ...authOnly, m.getOrgDepartments)
router.get('/org/departments/:dept_id/functions', ...authOnly, m.getOrgFunctions)
router.get('/org/functions/:func_id/halls', ...authOnly, m.getOrgHalls)
router.get('/org/halls/:hall_id/locations', ...authOnly, m.getOrgLocations)

// ─── Plants ───────────────────────────────────────────────────────────────────
router.get('/plants', ...authOnly, m.listPlants)
router.post('/plants', ...canManage, m.createPlant)
router.put('/plants/:id', ...canManage, m.updatePlant)
router.delete('/plants/:id', ...canManage, m.deletePlant)

// ─── Zones ────────────────────────────────────────────────────────────────────
router.get('/zones', ...authOnly, m.listZones)
router.post('/zones', ...canManage, m.createZone)
router.put('/zones/:id', ...canManage, m.updateZone)
router.delete('/zones/:id', ...canManage, m.deleteZone)

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments', ...authOnly, m.listDepartments)
router.post('/departments', ...canManage, m.createDepartment)
router.put('/departments/:id', ...canManage, m.updateDepartment)
router.delete('/departments/:id', ...canManage, m.deleteDepartment)

// ─── Functions ────────────────────────────────────────────────────────────────
router.get('/functions', ...authOnly, m.listFunctions)
router.post('/functions', ...canManage, m.createFunctionHandler)
router.put('/functions/:id', ...canManage, m.updateFunctionHandler)
router.delete('/functions/:id', ...canManage, m.deleteFunctionHandler)

// ─── Halls ────────────────────────────────────────────────────────────────────
router.get('/halls', ...authOnly, m.listHalls)
router.post('/halls', ...canManage, m.createHall)
router.put('/halls/:id', ...canManage, m.updateHall)
router.delete('/halls/:id', ...canManage, m.deleteHall)

// ─── Locations ────────────────────────────────────────────────────────────────
router.get('/locations', ...authOnly, m.listLocations)
router.post('/locations', ...canManage, m.createLocation)
router.put('/locations/:id', ...canManage, m.updateLocation)
router.delete('/locations/:id', ...canManage, m.deleteLocation)

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', ...authOnly, m.listCategories)
router.post('/categories', ...canManage, m.createCategory)
router.put('/categories/:id', ...canManage, m.updateCategory)
router.delete('/categories/:id', ...canManage, m.deleteCategory)

// ─── Sub-categories ───────────────────────────────────────────────────────────
router.get('/sub-categories', ...authOnly, m.listSubCategories)
router.post('/sub-categories', ...canManage, m.createSubCategory)
router.put('/sub-categories/:id', ...canManage, m.updateSubCategory)
router.delete('/sub-categories/:id', ...canManage, m.deleteSubCategory)

// ─── Tags ─────────────────────────────────────────────────────────────────────
router.get('/tags', ...authOnly, m.listTags)
router.post('/tags', ...canManage, m.createTag)
router.put('/tags/:id', ...canManage, m.updateTag)
router.delete('/tags/:id', ...canManage, m.deleteTag)

export { router as masterRouter }
