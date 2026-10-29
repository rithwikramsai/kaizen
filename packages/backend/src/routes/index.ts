import { Router, type Request, type Response } from 'express'
import { authRouter } from './auth.js'
import { usersRouter } from './users.js'
import { masterRouter } from './master.js'

const router: ReturnType<typeof Router> = Router()

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.use('/auth', authRouter)
router.use('/', usersRouter)
router.use('/master', masterRouter)

export { router }
