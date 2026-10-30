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
        ],
      },
    ],
  },
])
