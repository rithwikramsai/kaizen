import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Pool } = pg

const DATABASE_URL = process.env['DATABASE_URL']
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

async function ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `)
}

async function getAppliedMigrations(client: pg.PoolClient): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY filename',
  )
  return new Set(result.rows.map((r) => r.filename))
}

async function applyMigration(client: pg.PoolClient, filename: string, sql: string): Promise<void> {
  console.info(`  Applying ${filename}...`)
  await client.query('BEGIN')
  try {
    await client.query(sql)
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
    await client.query('COMMIT')
    console.info(`  ✓ ${filename}`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw new Error(`Migration ${filename} failed: ${String(err)}`)
  }
}

async function run(): Promise<void> {
  const client = await pool.connect()
  try {
    await ensureMigrationsTable(client)
    const applied = await getAppliedMigrations(client)

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()

    const pending = files.filter((f) => !applied.has(f))

    if (pending.length === 0) {
      console.info('No pending migrations.')
      return
    }

    console.info(`Running ${pending.length} migration(s)...`)
    for (const filename of pending) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf-8')
      await applyMigration(client, filename, sql)
    }
    console.info('All migrations applied successfully.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
