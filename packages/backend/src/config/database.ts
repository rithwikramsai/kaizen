import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

const url = env.NODE_ENV === 'test' ? (env.DATABASE_TEST_URL ?? env.DATABASE_URL) : env.DATABASE_URL

export const pool = new Pool({
  connectionString: url,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err)
  process.exit(1)
})

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
    console.info('Database connection established.')
  } finally {
    client.release()
  }
}
