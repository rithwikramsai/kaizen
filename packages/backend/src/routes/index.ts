import { Router, type Request, type Response } from 'express'

const router: ReturnType<typeof Router> = Router()

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export { router }
