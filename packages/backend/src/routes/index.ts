import { Router, type Request, type Response } from 'express'
import { authRouter } from './auth.js'
import { usersRouter } from './users.js'
import { masterRouter } from './master.js'
import { workflowRouter } from './workflow.js'
import { ideasRouter } from './ideas.js'
import { filesRouter } from './files.js'
import { kaizensRouter } from './kaizens.js'
import { rewardsRouter } from './rewards.js'
import { notificationsRouter } from './notifications.js'
import { reportsRouter } from './reports.js'
import { analyticsRouter } from './analytics.js'
import { adminRouter } from './admin.js'
import { publicRouter } from './public.js'

const router: ReturnType<typeof Router> = Router()

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.use('/public', publicRouter)   // unauthenticated — must come before authRouter
router.use('/auth', authRouter)
router.use('/', usersRouter)
router.use('/master', masterRouter)
router.use('/workflow', workflowRouter)
router.use('/ideas', ideasRouter)
router.use('/files', filesRouter)
router.use('/kaizens', kaizensRouter)
router.use('/rewards', rewardsRouter)
router.use('/notifications', notificationsRouter)
router.use('/reports', reportsRouter)
router.use('/analytics', analyticsRouter)
router.use('/admin', adminRouter)

export { router }
