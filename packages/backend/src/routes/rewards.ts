import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission } from '../middleware/requirePermission.js'
import * as ctrl from '../controllers/rewards.controller.js'

export const rewardsRouter: ReturnType<typeof Router> = Router()

// GET /rewards/queue — plant OPEX or nominator can view
rewardsRouter.get('/queue', authenticate, requirePermission('CAN_ASSIGN_REWARD'), ctrl.getQueue)

// POST /rewards/assign/:kaizenId
rewardsRouter.post('/assign/:kaizenId', authenticate, requirePermission('CAN_ASSIGN_REWARD'), ctrl.assignReward)

// POST /rewards/nominate-high-impact/:kaizenId
rewardsRouter.post('/nominate-high-impact/:kaizenId', authenticate, requirePermission('CAN_NOMINATE_HIGH_IMPACT'), ctrl.nominateForHighImpact)

// Nomination sub-routes — order matters: specific paths before :param
rewardsRouter.get('/nominations/:nominationId', authenticate, requirePermission('CAN_NOMINATE_HIGH_IMPACT'), ctrl.getNomination)
rewardsRouter.post('/nominations/:nominationId/rate', authenticate, requirePermission('CAN_RATE_HIGH_IMPACT'), ctrl.submitRating)
rewardsRouter.post('/nominations/:nominationId/nominate-special', authenticate, requirePermission('CAN_NOMINATE_SPECIAL_RR'), ctrl.nominateSpecial)
rewardsRouter.post('/nominations/:nominationId/nominate-inter-plant', authenticate, requirePermission('CAN_NOMINATE_HIGH_IMPACT'), ctrl.nominateForInterPlant)

// History and leaderboard
rewardsRouter.get('/history', authenticate, requirePermission('CAN_ASSIGN_REWARD'), ctrl.getHistory)
rewardsRouter.get('/leaderboard', authenticate, requirePermission('CAN_ASSIGN_REWARD'), ctrl.getLeaderboardData)

// SC member pending ratings
rewardsRouter.get('/my-ratings', authenticate, requirePermission('CAN_RATE_HIGH_IMPACT'), ctrl.getMyRatings)
