import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '../components/Layout.js'
import { ProtectedRoute } from '../components/ProtectedRoute.js'
import { LoginPage } from '../pages/LoginPage.js'
import { PublicIdeaSubmissionPage } from '../pages/public/PublicIdeaSubmissionPage.js'
import { AuthCallbackPage } from '../pages/auth/AuthCallbackPage.js'
import { IdeaSubmitPage } from '../pages/ideas/IdeaSubmitPage.js'
import { MyIdeasPage } from '../pages/ideas/MyIdeasPage.js'
import { IdeasListPage } from '../pages/ideas/IdeasListPage.js'
import { IdeaDetailPage } from '../pages/ideas/IdeaDetailPage.js'
import { IdeaEditPage } from '../pages/ideas/IdeaEditPage.js'
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
import { AnalyticsPage } from '../pages/reports/AnalyticsPage.js'
import { SLAReportPage } from '../pages/reports/SLAReportPage.js'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.js'
import { UserManagementPage } from '../pages/admin/UserManagementPage.js'
import { MasterDataPage } from '../pages/admin/MasterDataPage.js'
import { WorkflowTemplatesPage } from '../pages/admin/WorkflowTemplatesPage.js'
import { SLAConfigurationPage } from '../pages/admin/SLAConfigurationPage.js'
import { AuditLogViewerPage } from '../pages/admin/AuditLogViewerPage.js'
import { SystemHealthPage } from '../pages/admin/SystemHealthPage.js'

export const router = createBrowserRouter([
  { path: '/login',             element: <LoginPage /> },
  { path: '/submit-anonymous',  element: <PublicIdeaSubmissionPage /> },
  { path: '/auth/callback',     element: <AuthCallbackPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/ideas" replace /> },
          { path: 'ideas', element: <MyIdeasPage /> },
          { path: 'ideas/new',      element: <IdeaSubmitPage /> },
          { path: 'ideas/all',      element: <IdeasListPage /> },
          { path: 'ideas/:id',      element: <IdeaDetailPage /> },
          { path: 'ideas/:id/edit', element: <IdeaEditPage /> },
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
          { path: 'reports/trends',     element: <Navigate to="/reports/analytics" replace /> },
          { path: 'reports/analytics',  element: <AnalyticsPage /> },
          { path: 'reports/sla',        element: <SLAReportPage /> },
          { path: 'admin',              element: <AdminDashboardPage /> },
          { path: 'admin/users',        element: <UserManagementPage /> },
          { path: 'admin/master-data',  element: <MasterDataPage /> },
          { path: 'admin/workflows',    element: <WorkflowTemplatesPage /> },
          { path: 'admin/sla',          element: <SLAConfigurationPage /> },
          { path: 'admin/audit',        element: <AuditLogViewerPage /> },
          { path: 'admin/health',       element: <SystemHealthPage /> },
        ],
      },
    ],
  },
])
