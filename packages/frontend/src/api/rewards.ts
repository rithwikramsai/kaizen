import { authFetch } from './client.js'

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

export interface ScRatingRow {
  id: string
  sc_member_id: string
  sc_member_name: string
  has_rated: boolean
  rating_score: number | null
  rating_notes: string | null
  rated_at: string | null
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
  sc_ratings: ScRatingRow[]
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
  nomination_status?: string
  competition_round?: string
  result?: string | null
  competition_year?: number
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

export interface ScPendingItem {
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
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function getRewardsQueue(): Promise<ApprovedKaizenForRR[]> {
  return authFetch<ApprovedKaizenForRR[]>('/rewards/queue')
}

export function assignRegularReward(kaizenId: string, rewardAmount: number | null, rewardDetails: string | null): Promise<{ rewardId: string }> {
  return authFetch<{ rewardId: string }>(`/rewards/assign/${kaizenId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reward_amount: rewardAmount, reward_details: rewardDetails }),
  })
}

export function nominateHighImpact(
  kaizenId: string,
  scMemberIds: string[],
  remarks?: string,
): Promise<{ nominationId: string }> {
  return authFetch<{ nominationId: string }>(`/rewards/nominate-high-impact/${kaizenId}`, {
    method: 'POST',
    body: JSON.stringify({ scMemberIds, ...(remarks ? { remarks } : {}) }),
  })
}

export type SCMember = { id: string; full_name: string; email: string }

export function getSCMembers(): Promise<SCMember[]> {
  return authFetch<SCMember[]>('/rewards/sc-members')
}

export function getNominationDetail(nominationId: string): Promise<NominationDetail> {
  return authFetch<NominationDetail>(`/rewards/nominations/${nominationId}`)
}

export function submitScRating(
  nominationId: string,
  scores: { businessImpact: 1 | 3 | 5; sustenance: 1 | 3 | 5; innovation: 1 | 3 | 5; bprRecommendation: boolean },
  ratingNotes: string | null,
): Promise<{ message: string }> {
  return authFetch<{ message: string }>(`/rewards/nominations/${nominationId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_impact_score: scores.businessImpact,
      sustenance_score: scores.sustenance,
      innovation_score: scores.innovation,
      bpr_recommendation: scores.bprRecommendation,
      rating_notes: ratingNotes,
    }),
  })
}

export function nominateSpecialRR(nominationId: string, rewardAmount: number | null, rewardDetails: string | null): Promise<{ rewardId: string }> {
  return authFetch<{ rewardId: string }>(`/rewards/nominations/${nominationId}/nominate-special`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reward_amount: rewardAmount, reward_details: rewardDetails }),
  })
}

export function nominateInterPlant(nominationId: string, competitionYear: number, competitionRound: string): Promise<{ interPlantId: string }> {
  return authFetch<{ interPlantId: string }>(`/rewards/nominations/${nominationId}/nominate-inter-plant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ competition_year: competitionYear, competition_round: competitionRound }),
  })
}

export function getRewardHistory(): Promise<RewardHistoryItem[]> {
  return authFetch<RewardHistoryItem[]>('/rewards/history')
}

export function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return authFetch<LeaderboardEntry[]>('/rewards/leaderboard')
}

export function getMyRatings(): Promise<ScPendingItem[]> {
  return authFetch<ScPendingItem[]>('/rewards/my-ratings')
}
