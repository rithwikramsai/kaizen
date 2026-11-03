import { useEffect, useState } from 'react'

const TOKEN_KEY = 'kiet_access_token'
const REFRESH_KEY = 'kiet_refresh_token'
const USER_KEY = 'kiet_user'

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const refreshToken = params.get('refresh_token')
    const userB64 = params.get('user')

    if (token && refreshToken && userB64) {
      try {
        const userJson = atob(userB64)
        JSON.parse(userJson) // validate JSON before storing
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(REFRESH_KEY, refreshToken)
        localStorage.setItem(USER_KEY, userJson)
        window.location.replace('/ideas')
      } catch {
        setError('Invalid SSO response. Please try again.')
      }
    } else {
      setError(params.get('error') ?? 'SSO authentication failed. Please try again.')
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-400 text-5xl mb-4">⚠</div>
          <h2 className="text-white text-xl font-bold mb-2">Sign-in Failed</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300 font-medium">Completing sign-in…</p>
        <p className="text-slate-500 text-sm mt-1">You will be redirected shortly.</p>
      </div>
    </div>
  )
}
