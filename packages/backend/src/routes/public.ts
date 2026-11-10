import { Router, type Request, type Response, type NextFunction } from 'express'
import * as ctrl from '../controllers/publicIdeas.controller.js'

const router: ReturnType<typeof Router> = Router()

// ─── Simple in-memory sliding-window rate limiter (no external dependency) ───

interface RateBucket { count: number; resetAt: number }
const _store = new Map<string, RateBucket>()

function rateLimiter(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip ?? 'unknown'}:${req.path}`
    const now  = Date.now()
    const bucket = _store.get(key)

    if (!bucket || now > bucket.resetAt) {
      _store.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }
    if (bucket.count >= max) {
      res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests — please try again later' },
      })
      return
    }
    bucket.count++
    next()
  }
}

const lookupLimiter = rateLimiter(60, 60 * 60 * 1000)  // 60 lookups / hour per IP
const submitLimiter = rateLimiter(20, 60 * 60 * 1000)  // 20 submissions / hour per IP
const uploadLimiter = rateLimiter(30, 60 * 60 * 1000)  // 30 uploads / hour per IP

// ─── Routes (no authentication required) ─────────────────────────────────────

router.get('/employee-lookup', lookupLimiter, ctrl.employeeLookup)
router.get('/master-data',                   ctrl.publicMasterData)
router.get('/ideas/track', lookupLimiter,    ctrl.trackIdea)
router.get('/qr',                            ctrl.getQrCode)

router.post('/upload', uploadLimiter, ctrl.publicFileUploadMiddleware, ctrl.publicFileUpload)
router.post('/idea-submit', submitLimiter,   ctrl.publicIdeaSubmit)

export { router as publicRouter }
