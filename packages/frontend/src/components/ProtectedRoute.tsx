import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { TOKEN_KEY } from '../api/client.js'

function tokenIsExpired(): boolean {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { exp: number }
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  if (!user || tokenIsExpired()) return <Navigate to="/login" replace />

  return <Outlet />
}
