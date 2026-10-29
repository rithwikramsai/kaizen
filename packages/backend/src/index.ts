import { env } from './config/env.js'
import { createApp } from './app.js'
import { checkDatabaseConnection } from './config/database.js'

async function start(): Promise<void> {
  await checkDatabaseConnection()

  const app = createApp()
  app.listen(env.PORT, () => {
    console.info(`KIET API running on http://localhost:${env.PORT}`)
    console.info(`Environment: ${env.NODE_ENV}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
