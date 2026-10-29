import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import * as users from '../controllers/users.controller.js'

const router: ReturnType<typeof Router> = Router()

const canManageUsers = [authenticate, requirePermission('CAN_MANAGE_USERS')]
const canManageSystem = [authenticate, requirePermission('CAN_MANAGE_SYSTEM')]

router.get('/users', ...canManageUsers, users.listUsers)
router.post('/users', ...canManageUsers, users.createUser)
router.put('/users/:id', ...canManageUsers, users.updateUser)
router.put('/users/:id/deactivate', ...canManageUsers, users.deactivateUser)
router.post('/users/:id/roles', ...canManageUsers, users.assignRole)
router.delete('/users/:id/roles/:role_id', ...canManageUsers, users.revokeRole)

router.get('/roles', ...canManageUsers, users.listRoles)
router.get('/permissions', ...canManageSystem, users.listPermissions)

export { router as usersRouter }
