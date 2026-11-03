import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import * as auth from '../controllers/auth.controller.js'
import * as msAuth from '../controllers/microsoftAuth.controller.js'

const router: ReturnType<typeof Router> = Router()

router.post('/login', auth.login)
router.post('/refresh', auth.refresh)
router.post('/logout', authenticate, auth.logout)

// Microsoft Azure AD SSO
router.get('/microsoft', (req, res) => { void msAuth.redirectToMicrosoft(req, res) })
router.get('/microsoft/callback', (req, res) => { void msAuth.microsoftCallback(req, res) })

export { router as authRouter }
