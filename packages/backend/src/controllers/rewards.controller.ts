import type { Request, Response } from 'express'
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js'
import { ServiceError } from '../utils/errors.js'
import {
  getApprovedKaizensForRR,
  assignRegularReward,
  nominateHighImpact,
  getNominationDetail,
  submitScRating,
  nominateSpecialRR,
  nominateInterPlant,
  getRewardHistory,
  getLeaderboard,
  getScPendingNominations,
  getSCMembersForPlant,
} from '../services/rewards.service.js'

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    sendError(res, err.httpStatus, err.code, err.message)
  } else {
    console.error('Rewards controller error:', err)
    sendError(res, 500, ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  }
}

// GET /rewards/queue
export async function getQueue(req: Request, res: Response): Promise<void> {
  try {
    const data = await getApprovedKaizensForRR(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// POST /rewards/assign/:kaizenId
export async function assignReward(req: Request, res: Response): Promise<void> {
  try {
    const { kaizenId } = req.params
    const { reward_amount, reward_details } = req.body as { reward_amount?: number; reward_details?: string }
    const result = await assignRegularReward({
      kaizenId: kaizenId!,
      actorId: req.user!.id,
      actorPlantId: req.user!.plant_id,
      rewardAmount: reward_amount ?? null,
      rewardDetails: reward_details ?? null,
    })
    sendSuccess(res, result, 201)
  } catch (err) {
    handleError(res, err)
  }
}

// POST /rewards/nominate-high-impact/:kaizenId
export async function nominateForHighImpact(req: Request, res: Response): Promise<void> {
  try {
    const { kaizenId } = req.params
    const { scMemberIds, remarks } = req.body as { scMemberIds?: string[]; remarks?: string }
    if (!Array.isArray(scMemberIds) || scMemberIds.length === 0) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'At least one Steering Committee Member must be selected')
      return
    }
    const result = await nominateHighImpact({
      kaizenId: kaizenId!,
      actorId: req.user!.id,
      actorPlantId: req.user!.plant_id,
      scMemberIds,
      ...(remarks ? { remarks } : {}),
    })
    sendSuccess(res, result, 201)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /rewards/nominations/:nominationId
export async function getNomination(req: Request, res: Response): Promise<void> {
  try {
    const { nominationId } = req.params
    const data = await getNominationDetail(nominationId!, req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// POST /rewards/nominations/:nominationId/rate
export async function submitRating(req: Request, res: Response): Promise<void> {
  try {
    const { nominationId } = req.params
    const body = req.body as {
      business_impact_score?: number
      sustenance_score?: number
      innovation_score?: number
      bpr_recommendation?: boolean
      rating_notes?: string
    }
    const { business_impact_score, sustenance_score, innovation_score, bpr_recommendation, rating_notes } = body
    if (!business_impact_score || !sustenance_score || !innovation_score) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'business_impact_score, sustenance_score, and innovation_score are all required')
      return
    }
    const validScores = [1, 3, 5]
    if (!validScores.includes(business_impact_score) || !validScores.includes(sustenance_score) || !validScores.includes(innovation_score)) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Each score must be 1, 3, or 5')
      return
    }
    await submitScRating({
      nominationId: nominationId!,
      actorId: req.user!.id,
      actorPlantId: req.user!.plant_id,
      businessImpactScore: business_impact_score as 1 | 3 | 5,
      sustenanceScore: sustenance_score as 1 | 3 | 5,
      innovationScore: innovation_score as 1 | 3 | 5,
      bprRecommendation: bpr_recommendation ?? false,
      ratingNotes: rating_notes ?? null,
    })
    sendSuccess(res, { message: 'Rating submitted' })
  } catch (err) {
    handleError(res, err)
  }
}

// POST /rewards/nominations/:nominationId/nominate-special
export async function nominateSpecial(req: Request, res: Response): Promise<void> {
  try {
    const { nominationId } = req.params
    const { reward_amount, reward_details } = req.body as { reward_amount?: number; reward_details?: string }
    const result = await nominateSpecialRR({
      nominationId: nominationId!,
      actorId: req.user!.id,
      actorPlantId: req.user!.plant_id,
      rewardAmount: reward_amount ?? null,
      rewardDetails: reward_details ?? null,
    })
    sendSuccess(res, result, 201)
  } catch (err) {
    handleError(res, err)
  }
}

// POST /rewards/nominations/:nominationId/nominate-inter-plant
export async function nominateForInterPlant(req: Request, res: Response): Promise<void> {
  try {
    const { nominationId } = req.params
    const { competition_year, competition_round } = req.body as { competition_year: number; competition_round: string }
    if (!competition_year || !competition_round) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'competition_year and competition_round are required')
      return
    }
    const result = await nominateInterPlant({
      nominationId: nominationId!,
      actorId: req.user!.id,
      actorPlantId: req.user!.plant_id,
      competitionYear: Number(competition_year),
      competitionRound: competition_round,
    })
    sendSuccess(res, result, 201)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /rewards/sc-members
export async function getScMembers(req: Request, res: Response): Promise<void> {
  try {
    const data = await getSCMembersForPlant(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /rewards/history
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const data = await getRewardHistory(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /rewards/leaderboard
export async function getLeaderboardData(req: Request, res: Response): Promise<void> {
  try {
    const data = await getLeaderboard(req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}

// GET /rewards/my-ratings
export async function getMyRatings(req: Request, res: Response): Promise<void> {
  try {
    const data = await getScPendingNominations(req.user!.id, req.user!.plant_id)
    sendSuccess(res, data)
  } catch (err) {
    handleError(res, err)
  }
}
