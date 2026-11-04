import { pool } from '../config/database.js'

// BRD format: IDEA-{plantCode}-{YY}-{seq}  e.g. IDEA-NSK-26-0055
// Uses a dedicated sequence to eliminate the COUNT(*)+1 race condition (H8).
export async function generateRegistrationId(plantCode: string): Promise<string> {
  const yy = new Date().getFullYear().toString().slice(-2)
  const res = await pool.query<{ nextval: string }>(
    `SELECT nextval('idea_registration_seq') AS nextval`,
  )
  const seq = parseInt(res.rows[0]!.nextval, 10).toString().padStart(4, '0')
  return `IDEA-${plantCode}-${yy}-${seq}`
}

// Format: KIET-K-{YY}-{seq}  e.g. KIET-K-26-0012
export async function generateKaizenId(plantCode: string): Promise<string> {
  const yy = new Date().getFullYear().toString().slice(-2)
  const res = await pool.query<{ nextval: string }>(
    `SELECT nextval('kaizen_id_seq') AS nextval`,
  )
  const seq = parseInt(res.rows[0]!.nextval, 10).toString().padStart(4, '0')
  return `KIET-K-${yy}-${seq}`
}
