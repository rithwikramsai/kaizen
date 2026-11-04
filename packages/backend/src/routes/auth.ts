import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/authenticate.js'
import * as auth from '../controllers/auth.controller.js'
import * as msAuth from '../controllers/microsoftAuth.controller.js'

const router: ReturnType<typeof Router> = Router()

// 10 attempts per IP per 15 minutes on login (L5 — NFR-SEC-003)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
})

router.post('/login', loginLimiter, auth.login)
router.post('/refresh', auth.refresh)
router.post('/logout', authenticate, auth.logout)

// Forgot / reset password (M14)
router.post('/forgot-password', auth.forgotPassword)
router.post('/reset-password', auth.resetPassword)
router.post('/change-password', authenticate, auth.changePassword)

// Microsoft Azure AD SSO
router.get('/microsoft', (req, res) => { void msAuth.redirectToMicrosoft(req, res) })
router.get('/microsoft/callback', (req, res) => { void msAuth.microsoftCallback(req, res) })

export { router as authRouter }
