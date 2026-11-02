import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '../components/Layout.js'
import { ProtectedRoute } from '../components/ProtectedRoute.js'
import { LoginPage } from '../pages/LoginPage.js'
import { IdeaSubmitPage } from '../pages/ideas/IdeaSubmitPage.js'
import { MyIdeasPage } from '../pages/ideas/MyIdeasPage.js'
import { IdeasListPage } from '../pages/ideas/IdeasListPage.js'
import { IdeaDetailPage } from '../pages/ideas/IdeaDetailPage.js'
import { ApprovedQueuePage } from '../pages/kaizens/ApprovedQueuePage.js'
import { KaizenOnePagerPage } from '../pages/kaizens/KaizenOnePagerPage.js'
import { ReviewQueuePage } from '../pages/review/ReviewQueuePage.js'
import { RewardsQueuePage } from '../pages/rewards/RewardsQueuePage.js'
import { NominationDetailPage } from '../pages/rewards/NominationDetailPage.js'
import { SCRatingPage } from '../pages/rewards/SCRatingPage.js'
import { RewardHistoryPage } from '../pages/rewards/RewardHistoryPage.js'
import { LeaderboardPage } from '../pages/rewards/LeaderboardPage.js'
import { NotificationCenterPage } from '../pages/notifications/NotificationCenterPage.js'
import { DashboardPage } from '../pages/reports/DashboardPage.js'
import { TrendsPage } from '../pages/reports/TrendsPage.js'
import { AnalyticsPage } from '../pages/reports/AnalyticsPage.js'
import { SLAReportPage } from '../pages/reports/SLAReportPage.js'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/ideas" replace /> },
          { path: 'ideas', element: <MyIdeasPage /> },
          { path: 'ideas/new', element: <IdeaSubmitPage /> },
          { path: 'ideas/all', element: <IdeasListPage /> },
          { path: 'ideas/:id', element: <IdeaDetailPage /> },
          { path: 'review', element: <ReviewQueuePage /> },
          { path: 'kaizens', element: <ApprovedQueuePage /> },
          { path: 'kaizens/:kaizenId', element: <KaizenOnePagerPage /> },
          { path: 'rewards', element: <RewardsQueuePage /> },
          { path: 'rewards/nominations/:nominationId', element: <NominationDetailPage /> },
          { path: 'rewards/sc-ratings', element: <SCRatingPage /> },
          { path: 'rewards/history', element: <RewardHistoryPage /> },
          { path: 'rewards/leaderboard', element: <LeaderboardPage /> },
          { path: 'notifications', element: <NotificationCenterPage /> },
          { path: 'reports/dashboard',  element: <DashboardPage /> },
          { path: 'reports/trends',     element: <TrendsPage /> },
          { path: 'reports/analytics',  element: <AnalyticsPage /> },
          { path: 'reports/sla',        element: <SLAReportPage /> },
        ],
      },
    ],
  },
])
