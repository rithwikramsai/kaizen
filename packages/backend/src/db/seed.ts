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

const SEEDS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seeds')

async function run(): Promise<void> {
  const client = await pool.connect()
  try {
    let files: string[] = []
    try {
      files = (await fs.readdir(SEEDS_DIR)).filter((f) => f.endsWith('.sql')).sort()
    } catch {
      console.info('No seeds directory found — skipping.')
      return
    }

    if (files.length === 0) {
      console.info('No seed files found.')
      return
    }

    console.info(`Running ${files.length} seed file(s)...`)
    for (const filename of files) {
      console.info(`  Seeding ${filename}...`)
      const sql = await fs.readFile(path.join(SEEDS_DIR, filename), 'utf-8')
      await client.query(sql)
      console.info(`  ✓ ${filename}`)
    }
    console.info('Seeding complete.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
