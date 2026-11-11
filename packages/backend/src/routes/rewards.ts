import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { requirePermission, requireAnyPermission } from '../middleware/requirePermission.js'
import {
  getQueue,
  assignReward,
  nominateForHighImpact,
  getNomination,
  submitRating,
  nominateSpecial,
  nominateForInterPlant,
  getHistory,
  getLeaderboardData,
  getMyRatings,
  getScMembers,
} from '../controllers/rewards.controller.js'

export const rewardsRouter: ReturnType<typeof Router> = Router()

rewardsRouter.use(authenticate)

// R&R queue — approved kaizens with reward/nomination status
rewardsRouter.get('/queue', requirePermission('CAN_ASSIGN_REWARD'), getQueue)

// Assign regular reward
rewardsRouter.post('/assign/:kaizenId', requirePermission('CAN_ASSIGN_REWARD'), assignReward)

// Nominate for high impact
rewardsRouter.post('/nominate-high-impact/:kaizenId', requirePermission('CAN_NOMINATE_HIGH_IMPACT'), nominateForHighImpact)

// Nomination detail — raters need to open this page before they can rate (H4)
rewardsRouter.get('/nominations/:nominationId', requireAnyPermission('CAN_NOMINATE_HIGH_IMPACT', 'CAN_RATE_HIGH_IMPACT'), getNomination)

// SC member rates a nomination
rewardsRouter.post('/nominations/:nominationId/rate', requirePermission('CAN_RATE_HIGH_IMPACT'), submitRating)

// Nominate for special R&R (after ratings complete)
rewardsRouter.post('/nominations/:nominationId/nominate-special', requirePermission('CAN_NOMINATE_SPECIAL_RR'), nominateSpecial)

// Nominate for inter-plant competition
rewardsRouter.post('/nominations/:nominationId/nominate-inter-plant', requirePermission('CAN_NOMINATE_INTER_PLANT'), nominateForInterPlant)

// History — all rewards, nominations, inter-plant
rewardsRouter.get('/history', requirePermission('CAN_ASSIGN_REWARD'), getHistory)

// Leaderboard
rewardsRouter.get('/leaderboard', requirePermission('CAN_VIEW_REPORTS'), getLeaderboardData)

// SC member's own rating queue
rewardsRouter.get('/my-ratings', requirePermission('CAN_RATE_HIGH_IMPACT'), getMyRatings)

// SC members list for OPEX to pick from during High Impact nomination
rewardsRouter.get('/sc-members', requirePermission('CAN_NOMINATE_HIGH_IMPACT'), getScMembers)
