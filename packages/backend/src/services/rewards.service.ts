import { pool } from '../config/database.js'
import { ServiceError } from '../utils/errors.js'
import { ErrorCodes } from '../utils/response.js'
import { sendEmailForEvent } from './email/email.service.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovedKaizenForRR {
  kaizen_id: string
  kaizen_ref: string | null
  idea_id: string
  registration_id: string
  title: string
  implementation_owner: string | null
  owner_name: string | null
  submitter_name: string | null
  zone_name: string
  category_name: string | null
  department_name: string | null
  kaizen_status: string
  submission_date: string | null
  approval_date: string | null
  implementation_date: string | null
  final_score: number | null
  reward: { id: string; reward_type: string; reward_amount: number | null; assigned_at: string } | null
  nomination: { id: string; nomination_status: string; nominated_at: string } | null
}

export interface NominationDetail {
  id: string
  kaizen_id: string
  kaizen_ref: string | null
  title: string
  registration_id: string
  implementation_owner: string | null
  owner_name: string | null
  nomination_status: string
  nominated_at: string
  nominated_by_name: string
  sc_ratings: {
    id: string
    sc_member_id: string
    sc_member_name: string
    has_rated: boolean
    rating_score: number | null
    rating_notes: string | null
    rated_at: string | null
  }[]
}

export interface RewardHistoryItem {
  type: 'REGULAR' | 'SPECIAL' | 'INTER_PLANT'
  id: string
  kaizen_id: string
  kaizen_ref: string | null
  title: string
  registration_id: string
  owner_name: string | null
  zone_name: string
  reward_type?: string
  reward_amount?: number | null
  reward_details?: string | null
  nomination_status?: string | undefined
  competition_round?: string | undefined
  result?: string | null | undefined
  competition_year?: number | undefined
  assigned_at: string
}

export interface LeaderboardEntry {
  implementation_owner: string
  owner_name: string | null
  zone_name: string
  total_kaizens: number
  total_rewards: number
  high_impact_nominations: number
  inter_plant_nominations: number
}

// ─── Get Approved Kaizens For R&R ────────────────────────────────────────────

export async function getApprovedKaizensForRR(actorPlantId: string): Promise<ApprovedKaizenForRR[]> {
  const rows = await pool.query(
    `SELECT
       k.id AS kaizen_id,
       k.kaizen_id AS kaizen_ref,
       k.idea_id,
       i.registration_id,
       i.title,
       i.submitted_at AS submission_date,
       k.implementation_date,
       k.implementation_owner,
       u_owner.full_name AS owner_name,
       u_sub.full_name AS submitter_name,
       z.name AS zone_name,
       cat.name AS category_name,
       dep.name AS department_name,
       k.status AS kaizen_status,
       (SELECT al.performed_at FROM audit_logs al
        WHERE al.entity_type = 'kaizen' AND al.entity_id = k.id AND al.action = 'KAIZEN_APPROVED'
        ORDER BY al.performed_at DESC LIMIT 1) AS approval_date,
       (SELECT ROUND(AVG(sr.rating_score)::numeric, 1) FROM sc_ratings sr
        JOIN high_impact_nominations hin2 ON hin2.id = sr.nomination_id
        WHERE hin2.kaizen_id = k.id AND sr.has_rated = TRUE) AS final_score,
       r.id AS reward_id,
       r.reward_type,
       r.reward_amount,
       r.assigned_at AS reward_assigned_at,
       hin.id AS nomination_id,
       hin.nomination_status,
       hin.nominated_at
     FROM kaizens k
     JOIN ideas i ON i.id = k.idea_id
     JOIN zones z ON z.id = i.zone_id
     LEFT JOIN categories cat ON cat.id = i.category_id
     LEFT JOIN departments dep ON dep.id = i.department_id
     LEFT JOIN users u_owner ON u_owner.id = k.implementation_owner
     LEFT JOIN users u_sub ON u_sub.id = i.submitted_by
     LEFT JOIN rewards r ON r.kaizen_id = k.id
     LEFT JOIN high_impact_nominations hin ON hin.kaizen_id = k.id
     WHERE i.plant_id = $1
       AND k.status = 'APPROVED'
     ORDER BY k.updated_at DESC`,
    [actorPlantId],
  )

  return rows.rows.map((r) => ({
    kaizen_id: r.kaizen_id as string,
    kaizen_ref: r.kaizen_ref as string | null,
    idea_id: r.idea_id as string,
    registration_id: r.registration_id as string,
    title: r.title as string,
    implementation_owner: r.implementation_owner as string | null,
    owner_name: r.owner_name as string | null,
    submitter_name: r.submitter_name as string | null,
    zone_name: r.zone_name as string,
    category_name: r.category_name as string | null,
    department_name: r.department_name as string | null,
    kaizen_status: r.kaizen_status as string,
    submission_date: r.submission_date ? (r.submission_date as Date).toISOString() : null,
    approval_date: r.approval_date ? (r.approval_date as Date).toISOString() : null,
    implementation_date: r.implementation_date ? (r.implementation_date as Date).toISOString() : null,
    final_score: r.final_score != null ? Number(r.final_score) : null,
    reward: r.reward_id
      ? {
          id: r.reward_id as string,
          reward_type: r.reward_type as string,
          reward_amount: r.reward_amount != null ? Number(r.reward_amount) : null,
          assigned_at: (r.reward_assigned_at as Date).toISOString(),
        }
      : null,
    nomination: r.nomination_id
      ? {
          id: r.nomination_id as string,
          nomination_status: r.nomination_status as string,
          nominated_at: (r.nominated_at as Date).toISOString(),
        }
      : null,
  }))
}

// ─── Assign Regular Reward ────────────────────────────────────────────────────

export async function assignRegularReward(params: {
  kaizenId: string
  actorId: string
  actorPlantId: string
  rewardAmount: number | null
  rewardDetails: string | null
}): Promise<{ rewardId: string }> {
  const { kaizenId, actorId, actorPlantId, rewardAmount, rewardDetails } = params

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Plant isolation check
    const kaizenRes = await client.query<{ plant_id: string; status: string; implementation_owner: string | null; title: string | null; kaizen_id: string | null }>(
      `SELECT i.plant_id, k.status, k.implementation_owner, k.title, k.kaizen_id
       FROM kaizens k JOIN ideas i ON i.id = k.idea_id
       WHERE k.id = $1`,
      [kaizenId],
    )
    if (!kaizenRes.rows[0]) {
      throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Kaizen not found')
    }
    if (kaizenRes.rows[0].plant_id !== actorPlantId) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Plant isolation violation')
    }
    if (kaizenRes.rows[0].status !== 'APPROVED') {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Kaizen must be APPROVED to assign a reward')
    }

    // Prevent duplicate regular reward
    const existing = await client.query(
      `SELECT id FROM rewards WHERE kaizen_id = $1 AND reward_type = 'REGULAR'`,
      [kaizenId],
    )
    if (existing.rows.length > 0) {
      throw new ServiceError(409, ErrorCodes.CONFLICT, 'A regular reward has already been assigned to this kaizen')
    }

    const rewardRes = await client.query<{ id: string }>(
      `INSERT INTO rewards (kaizen_id, assigned_by, reward_type, reward_amount, reward_details)
       VALUES ($1, $2, 'REGULAR', $3, $4)
       RETURNING id`,
      [kaizenId, actorId, rewardAmount, rewardDetails],
    )
    const rewardId = rewardRes.rows[0]!.id

    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload)
       VALUES ($1, 'REGULAR_REWARD_ASSIGNED', 'kaizen', $2, $3)`,
      [actorId, kaizenId, JSON.stringify({ reward_id: rewardId, reward_amount: rewardAmount })],
    )

    await client.query('COMMIT')

    const { implementation_owner, title, kaizen_id: kaizenRef } = kaizenRes.rows[0]!
    if (implementation_owner) {
      void sendEmailForEvent('REWARD_ASSIGNED', implementation_owner, {
        kaizenRef: kaizenRef ?? undefined,
        kaizenTitle: title ?? undefined,
        rewardAmount: rewardAmount,
        rewardDetails: rewardDetails,
      })
    }

    return { rewardId }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Nominate High Impact ─────────────────────────────────────────────────────

export async function nominateHighImpact(params: {
  kaizenId: string
  actorId: string
  actorPlantId: string
}): Promise<{ nominationId: string }> {
  const { kaizenId, actorId, actorPlantId } = params

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Plant isolation + status check
    const kaizenRes = await client.query<{ plant_id: string; status: string; title: string | null; kaizen_id: string | null }>(
      `SELECT i.plant_id, k.status, k.title, k.kaizen_id
       FROM kaizens k JOIN ideas i ON i.id = k.idea_id
       WHERE k.id = $1`,
      [kaizenId],
    )
    if (!kaizenRes.rows[0]) {
      throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Kaizen not found')
    }
    if (kaizenRes.rows[0].plant_id !== actorPlantId) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Plant isolation violation')
    }
    if (kaizenRes.rows[0].status !== 'APPROVED') {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Kaizen must be APPROVED to nominate for high impact')
    }

    // Prevent duplicate nomination
    const existing = await client.query(
      `SELECT id FROM high_impact_nominations WHERE kaizen_id = $1`,
      [kaizenId],
    )
    if (existing.rows.length > 0) {
      throw new ServiceError(409, ErrorCodes.CONFLICT, 'This kaizen has already been nominated for high impact')
    }

    // Create nomination
    const nomRes = await client.query<{ id: string }>(
      `INSERT INTO high_impact_nominations (kaizen_id, nominated_by)
       VALUES ($1, $2)
       RETURNING id`,
      [kaizenId, actorId],
    )
    const nominationId = nomRes.rows[0]!.id

    // Auto-assign all active Steering Committee Members in the same plant
    const scMembers = await client.query<{ user_id: string }>(
      `SELECT DISTINCT ur.user_id
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       JOIN users u ON u.id = ur.user_id
       WHERE r.name = 'Steering Committee Member'
         AND ur.plant_id = $1
         AND u.is_active = TRUE`,
      [actorPlantId],
    )

    for (const sc of scMembers.rows) {
      await client.query(
        `INSERT INTO sc_ratings (nomination_id, sc_member_id) VALUES ($1, $2)`,
        [nominationId, sc.user_id],
      )
    }

    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload)
       VALUES ($1, 'HIGH_IMPACT_NOMINATED', 'kaizen', $2, $3)`,
      [actorId, kaizenId, JSON.stringify({ nomination_id: nominationId, sc_members_assigned: scMembers.rows.length })],
    )

    await client.query('COMMIT')

    const { title, kaizen_id: kaizenRef } = kaizenRes.rows[0]!
    for (const sc of scMembers.rows) {
      void sendEmailForEvent('HIGH_IMPACT_NOMINATED', sc.user_id, {
        kaizenRef: kaizenRef ?? undefined,
        kaizenTitle: title ?? undefined,
      })
    }

    return { nominationId }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Get Nomination Detail ────────────────────────────────────────────────────

export async function getNominationDetail(
  nominationId: string,
  actorPlantId: string,
): Promise<NominationDetail> {
  const nomRes = await pool.query(
    `SELECT
       hin.id, hin.kaizen_id, hin.nomination_status, hin.nominated_at,
       k.kaizen_id AS kaizen_ref,
       i.registration_id, i.title, i.plant_id,
       k.implementation_owner,
       u_owner.full_name AS owner_name,
       u_nominator.full_name AS nominated_by_name
     FROM high_impact_nominations hin
     JOIN kaizens k ON k.id = hin.kaizen_id
     JOIN ideas i ON i.id = k.idea_id
     LEFT JOIN users u_owner ON u_owner.id = k.implementation_owner
     JOIN users u_nominator ON u_nominator.id = hin.nominated_by
     WHERE hin.id = $1`,
    [nominationId],
  )

  if (!nomRes.rows[0]) {
    throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Nomination not found')
  }
  const nom = nomRes.rows[0]
  if (nom.plant_id !== actorPlantId) {
    throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Plant isolation violation')
  }

  const ratingsRes = await pool.query(
    `SELECT
       sr.id, sr.sc_member_id, sr.has_rated, sr.rating_score, sr.rating_notes, sr.rated_at,
       u.full_name AS sc_member_name
     FROM sc_ratings sr
     JOIN users u ON u.id = sr.sc_member_id
     WHERE sr.nomination_id = $1
     ORDER BY u.full_name ASC`,
    [nominationId],
  )

  return {
    id: nom.id as string,
    kaizen_id: nom.kaizen_id as string,
    kaizen_ref: nom.kaizen_ref as string | null,
    title: nom.title as string,
    registration_id: nom.registration_id as string,
    implementation_owner: nom.implementation_owner as string | null,
    owner_name: nom.owner_name as string | null,
    nomination_status: nom.nomination_status as string,
    nominated_at: (nom.nominated_at as Date).toISOString(),
    nominated_by_name: nom.nominated_by_name as string,
    sc_ratings: ratingsRes.rows.map((r) => ({
      id: r.id as string,
      sc_member_id: r.sc_member_id as string,
      sc_member_name: r.sc_member_name as string,
      has_rated: r.has_rated as boolean,
      rating_score: r.rating_score != null ? Number(r.rating_score) : null,
      rating_notes: r.rating_notes as string | null,
      rated_at: r.rated_at ? (r.rated_at as Date).toISOString() : null,
    })),
  }
}

// ─── Submit SC Rating ─────────────────────────────────────────────────────────

export async function submitScRating(params: {
  nominationId: string
  actorId: string
  actorPlantId: string
  ratingScore: number
  ratingNotes: string | null
}): Promise<void> {
  const { nominationId, actorId, actorPlantId, ratingScore, ratingNotes } = params

  if (ratingScore < 1 || ratingScore > 10) {
    throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Rating score must be between 1 and 10')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Plant isolation check via nomination → kaizen → idea
    const nomRes = await client.query<{ plant_id: string; nomination_status: string }>(
      `SELECT i.plant_id, hin.nomination_status
       FROM high_impact_nominations hin
       JOIN kaizens k ON k.id = hin.kaizen_id
       JOIN ideas i ON i.id = k.idea_id
       WHERE hin.id = $1`,
      [nominationId],
    )
    if (!nomRes.rows[0]) {
      throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Nomination not found')
    }
    if (nomRes.rows[0].plant_id !== actorPlantId) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Plant isolation violation')
    }
    if (nomRes.rows[0].nomination_status !== 'PENDING_RATINGS') {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Ratings can only be submitted when nomination is in PENDING_RATINGS status')
    }

    // Verify actor is assigned to rate this nomination
    const ratingRow = await client.query<{ id: string; has_rated: boolean }>(
      `SELECT id, has_rated FROM sc_ratings WHERE nomination_id = $1 AND sc_member_id = $2`,
      [nominationId, actorId],
    )
    if (!ratingRow.rows[0]) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'You are not assigned to rate this nomination')
    }
    if (ratingRow.rows[0].has_rated) {
      throw new ServiceError(409, ErrorCodes.CONFLICT, 'You have already submitted a rating for this nomination')
    }

    // Submit rating
    await client.query(
      `UPDATE sc_ratings
       SET rating_score = $1, rating_notes = $2, has_rated = TRUE, rated_at = NOW()
       WHERE id = $3`,
      [ratingScore, ratingNotes, ratingRow.rows[0]!.id],
    )

    // Check if all SC members have rated
    const pendingCount = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM sc_ratings WHERE nomination_id = $1 AND has_rated = FALSE`,
      [nominationId],
    )
    if (parseInt(pendingCount.rows[0]!.count) === 0) {
      await client.query(
        `UPDATE high_impact_nominations SET nomination_status = 'RATINGS_COMPLETE' WHERE id = $1`,
        [nominationId],
      )
    }

    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload)
       VALUES ($1, 'SC_RATING_SUBMITTED', 'kaizen', $2, $3)`,
      [actorId, nominationId, JSON.stringify({ rating_score: ratingScore })],
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Nominate Special R&R ─────────────────────────────────────────────────────

export async function nominateSpecialRR(params: {
  nominationId: string
  actorId: string
  actorPlantId: string
  rewardAmount: number | null
  rewardDetails: string | null
}): Promise<{ rewardId: string }> {
  const { nominationId, actorId, actorPlantId, rewardAmount, rewardDetails } = params

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const nomRes = await client.query<{ plant_id: string; nomination_status: string; kaizen_id: string }>(
      `SELECT i.plant_id, hin.nomination_status, hin.kaizen_id
       FROM high_impact_nominations hin
       JOIN kaizens k ON k.id = hin.kaizen_id
       JOIN ideas i ON i.id = k.idea_id
       WHERE hin.id = $1`,
      [nominationId],
    )
    if (!nomRes.rows[0]) {
      throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Nomination not found')
    }
    if (nomRes.rows[0].plant_id !== actorPlantId) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Plant isolation violation')
    }
    if (nomRes.rows[0].nomination_status !== 'RATINGS_COMPLETE') {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'All SC members must complete ratings before nominating for Special R&R')
    }

    const kaizenId = nomRes.rows[0].kaizen_id

    // Create SPECIAL reward record
    const rewardRes = await client.query<{ id: string }>(
      `INSERT INTO rewards (kaizen_id, assigned_by, reward_type, reward_amount, reward_details)
       VALUES ($1, $2, 'SPECIAL', $3, $4)
       RETURNING id`,
      [kaizenId, actorId, rewardAmount, rewardDetails],
    )
    const rewardId = rewardRes.rows[0]!.id

    // Advance nomination status
    await client.query(
      `UPDATE high_impact_nominations SET nomination_status = 'NOMINATED_SPECIAL' WHERE id = $1`,
      [nominationId],
    )

    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload)
       VALUES ($1, 'SPECIAL_REWARD_NOMINATED', 'kaizen', $2, $3)`,
      [actorId, nominationId, JSON.stringify({ reward_id: rewardId, kaizen_id: kaizenId })],
    )

    await client.query('COMMIT')
    return { rewardId }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Nominate Inter-Plant ─────────────────────────────────────────────────────

export async function nominateInterPlant(params: {
  nominationId: string
  actorId: string
  actorPlantId: string
  competitionYear: number
  competitionRound: string
}): Promise<{ interPlantId: string }> {
  const { nominationId, actorId, actorPlantId, competitionYear, competitionRound } = params

  const validRounds = ['PLANT', 'CLUSTER', 'NATIONAL']
  if (!validRounds.includes(competitionRound)) {
    throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'competition_round must be PLANT, CLUSTER, or NATIONAL')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const nomRes = await client.query<{ plant_id: string; nomination_status: string; kaizen_id: string }>(
      `SELECT i.plant_id, hin.nomination_status, hin.kaizen_id
       FROM high_impact_nominations hin
       JOIN kaizens k ON k.id = hin.kaizen_id
       JOIN ideas i ON i.id = k.idea_id
       WHERE hin.id = $1`,
      [nominationId],
    )
    if (!nomRes.rows[0]) {
      throw new ServiceError(404, ErrorCodes.NOT_FOUND, 'Nomination not found')
    }
    if (nomRes.rows[0].plant_id !== actorPlantId) {
      throw new ServiceError(403, ErrorCodes.FORBIDDEN, 'Plant isolation violation')
    }

    const allowedStatuses = ['RATINGS_COMPLETE', 'NOMINATED_SPECIAL']
    if (!allowedStatuses.includes(nomRes.rows[0].nomination_status)) {
      throw new ServiceError(400, ErrorCodes.VALIDATION_ERROR, 'Nomination must be in RATINGS_COMPLETE or NOMINATED_SPECIAL status')
    }

    const kaizenId = nomRes.rows[0].kaizen_id

    const ipRes = await client.query<{ id: string }>(
      `INSERT INTO inter_plant_nominations (kaizen_id, nomination_id, nominated_by, competition_year, competition_round)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [kaizenId, nominationId, actorId, competitionYear, competitionRound],
    )
    const interPlantId = ipRes.rows[0]!.id

    await client.query(
      `UPDATE high_impact_nominations SET nomination_status = 'NOMINATED_INTER_PLANT' WHERE id = $1`,
      [nominationId],
    )

    await client.query(
      `INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload)
       VALUES ($1, 'INTER_PLANT_NOMINATED', 'kaizen', $2, $3)`,
      [actorId, nominationId, JSON.stringify({ inter_plant_id: interPlantId, competition_round: competitionRound, competition_year: competitionYear })],
    )

    await client.query('COMMIT')
    return { interPlantId }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ─── Get Reward History ───────────────────────────────────────────────────────

export async function getRewardHistory(actorPlantId: string): Promise<RewardHistoryItem[]> {
  const regularRows = await pool.query(
    `SELECT
       r.id, r.kaizen_id, r.reward_type, r.reward_amount, r.reward_details, r.assigned_at,
       k.kaizen_id AS kaizen_ref,
       i.registration_id, i.title,
       u_owner.full_name AS owner_name,
       z.name AS zone_name
     FROM rewards r
     JOIN kaizens k ON k.id = r.kaizen_id
     JOIN ideas i ON i.id = k.idea_id
     JOIN zones z ON z.id = i.zone_id
     LEFT JOIN users u_owner ON u_owner.id = k.implementation_owner
     WHERE i.plant_id = $1
     ORDER BY r.assigned_at DESC`,
    [actorPlantId],
  )

  const nomRows = await pool.query(
    `SELECT
       hin.id, hin.kaizen_id, hin.nomination_status, hin.nominated_at,
       k.kaizen_id AS kaizen_ref,
       i.registration_id, i.title,
       u_owner.full_name AS owner_name,
       z.name AS zone_name
     FROM high_impact_nominations hin
     JOIN kaizens k ON k.id = hin.kaizen_id
     JOIN ideas i ON i.id = k.idea_id
     JOIN zones z ON z.id = i.zone_id
     LEFT JOIN users u_owner ON u_owner.id = k.implementation_owner
     WHERE i.plant_id = $1
     ORDER BY hin.nominated_at DESC`,
    [actorPlantId],
  )

  const ipRows = await pool.query(
    `SELECT
       ipn.id, ipn.kaizen_id, ipn.competition_round, ipn.competition_year, ipn.result, ipn.nominated_at,
       k.kaizen_id AS kaizen_ref,
       i.registration_id, i.title,
       u_owner.full_name AS owner_name,
       z.name AS zone_name
     FROM inter_plant_nominations ipn
     JOIN kaizens k ON k.id = ipn.kaizen_id
     JOIN ideas i ON i.id = k.idea_id
     JOIN zones z ON z.id = i.zone_id
     LEFT JOIN users u_owner ON u_owner.id = k.implementation_owner
     WHERE i.plant_id = $1
     ORDER BY ipn.nominated_at DESC`,
    [actorPlantId],
  )

  const results: RewardHistoryItem[] = []

  for (const r of regularRows.rows) {
    results.push({
      type: r.reward_type === 'SPECIAL' ? 'SPECIAL' : 'REGULAR',
      id: r.id as string,
      kaizen_id: r.kaizen_id as string,
      kaizen_ref: r.kaizen_ref as string | null,
      title: r.title as string,
      registration_id: r.registration_id as string,
      owner_name: r.owner_name as string | null,
      zone_name: r.zone_name as string,
      reward_type: r.reward_type as string,
      reward_amount: r.reward_amount != null ? Number(r.reward_amount) : null,
      reward_details: r.reward_details as string | null,
      assigned_at: (r.assigned_at as Date).toISOString(),
    })
  }

  for (const r of nomRows.rows) {
    results.push({
      type: 'REGULAR', // high impact nomination (not inter-plant)
      id: r.id as string,
      kaizen_id: r.kaizen_id as string,
      kaizen_ref: r.kaizen_ref as string | null,
      title: r.title as string,
      registration_id: r.registration_id as string,
      owner_name: r.owner_name as string | null,
      zone_name: r.zone_name as string,
      nomination_status: r.nomination_status as string,
      assigned_at: (r.nominated_at as Date).toISOString(),
    })
  }

  for (const r of ipRows.rows) {
    results.push({
      type: 'INTER_PLANT',
      id: r.id as string,
      kaizen_id: r.kaizen_id as string,
      kaizen_ref: r.kaizen_ref as string | null,
      title: r.title as string,
      registration_id: r.registration_id as string,
      owner_name: r.owner_name as string | null,
      zone_name: r.zone_name as string,
      competition_round: r.competition_round as string,
      competition_year: r.competition_year as number,
      result: r.result as string | null,
      assigned_at: (r.nominated_at as Date).toISOString(),
    })
  }

  return results
}

// ─── Get Leaderboard ──────────────────────────────────────────────────────────

export async function getLeaderboard(actorPlantId: string): Promise<LeaderboardEntry[]> {
  const rows = await pool.query(
    `SELECT
       k.implementation_owner,
       u.full_name AS owner_name,
       z.name AS zone_name,
       COUNT(DISTINCT k.id)::int AS total_kaizens,
       COUNT(DISTINCT r.id)::int AS total_rewards,
       COUNT(DISTINCT hin.id)::int AS high_impact_nominations,
       COUNT(DISTINCT ipn.id)::int AS inter_plant_nominations
     FROM kaizens k
     JOIN ideas i ON i.id = k.idea_id
     JOIN zones z ON z.id = i.zone_id
     LEFT JOIN users u ON u.id = k.implementation_owner
     LEFT JOIN rewards r ON r.kaizen_id = k.id
     LEFT JOIN high_impact_nominations hin ON hin.kaizen_id = k.id
     LEFT JOIN inter_plant_nominations ipn ON ipn.kaizen_id = k.id
     WHERE i.plant_id = $1
       AND k.status = 'APPROVED'
       AND k.implementation_owner IS NOT NULL
     GROUP BY k.implementation_owner, u.full_name, z.name
     ORDER BY total_rewards DESC, high_impact_nominations DESC, total_kaizens DESC
     LIMIT 50`,
    [actorPlantId],
  )

  return rows.rows.map((r) => ({
    implementation_owner: r.implementation_owner as string,
    owner_name: r.owner_name as string | null,
    zone_name: r.zone_name as string,
    total_kaizens: r.total_kaizens as number,
    total_rewards: r.total_rewards as number,
    high_impact_nominations: r.high_impact_nominations as number,
    inter_plant_nominations: r.inter_plant_nominations as number,
  }))
}

// ─── Get SC Pending Nominations ───────────────────────────────────────────────

export async function getScPendingNominations(actorId: string, actorPlantId: string): Promise<{
  nomination_id: string
  nomination_status: string
  nominated_at: string
  kaizen_id: string
  kaizen_ref: string | null
  registration_id: string
  title: string
  owner_name: string | null
  zone_name: string
  rating_id: string
  has_rated: boolean
}[]> {
  const rows = await pool.query(
    `SELECT
       hin.id AS nomination_id,
       hin.nomination_status,
       hin.nominated_at,
       k.id AS kaizen_id,
       k.kaizen_id AS kaizen_ref,
       i.registration_id, i.title,
       u_owner.full_name AS owner_name,
       z.name AS zone_name,
       sr.id AS rating_id,
       sr.has_rated
     FROM sc_ratings sr
     JOIN high_impact_nominations hin ON hin.id = sr.nomination_id
     JOIN kaizens k ON k.id = hin.kaizen_id
     JOIN ideas i ON i.id = k.idea_id
     JOIN zones z ON z.id = i.zone_id
     LEFT JOIN users u_owner ON u_owner.id = k.implementation_owner
     WHERE sr.sc_member_id = $1
       AND i.plant_id = $2
     ORDER BY sr.has_rated ASC, hin.nominated_at DESC`,
    [actorId, actorPlantId],
  )

  return rows.rows.map((r) => ({
    nomination_id: r.nomination_id as string,
    nomination_status: r.nomination_status as string,
    nominated_at: (r.nominated_at as Date).toISOString(),
    kaizen_id: r.kaizen_id as string,
    kaizen_ref: r.kaizen_ref as string | null,
    registration_id: r.registration_id as string,
    title: r.title as string,
    owner_name: r.owner_name as string | null,
    zone_name: r.zone_name as string,
    rating_id: r.rating_id as string,
    has_rated: r.has_rated as boolean,
  }))
}
