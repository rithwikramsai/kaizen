import { pool } from '../config/database.js'

export async function generateRegistrationId(plantCode: string): Promise<string> {
  const year = new Date().getFullYear()
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ideas
     WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year],
  )
  const seq = (parseInt(result.rows[0]?.count ?? '0', 10) + 1).toString().padStart(4, '0')
  return `KIET-${year}-${seq}`
}

export async function generateKaizenId(plantCode: string): Promise<string> {
  const year = new Date().getFullYear()
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM kaizens
     WHERE EXTRACT(YEAR FROM created_at) = $1`,
    [year],
  )
  const seq = (parseInt(result.rows[0]?.count ?? '0', 10) + 1).toString().padStart(4, '0')
  return `KIET-K-${year}-${seq}`
}
