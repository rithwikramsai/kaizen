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
    const result = await nominateHighImpact({
      kaizenId: kaizenId!,
      actorId: req.user!.id,
      actorPlantId: req.user!.plant_id,
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
    const { rating_score, rating_notes } = req.body as { rating_score: number; rating_notes?: string }
    if (rating_score === undefined || rating_score === null) {
      sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'rating_score is required')
      return
    }
    await submitScRating({
      nominationId: nominationId!,
      actorId: req.user!.id,
      actorPlantId: req.user!.plant_id,
      ratingScore: Number(rating_score),
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
