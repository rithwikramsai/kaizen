import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import * as auth from '../controllers/auth.controller.js'

const router: ReturnType<typeof Router> = Router()

router.post('/login', auth.login)
router.post('/refresh', auth.refresh)
router.post('/logout', authenticate, auth.logout)

export { router as authRouter }
