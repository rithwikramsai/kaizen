import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { useI18n, LANGUAGES } from '../i18n/index.js'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

// ─── SVG Icons ─────────────────────────────────────────────────────────────────

function KaizenLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="acgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8294a" />
          <stop offset="100%" stopColor="#c0182f" />
        </linearGradient>
      </defs>
      <polygon
        points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="url(#acgGradient)"
      />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="white"
        fontSize="18"
        fontWeight="800"
        fontFamily="Inter,sans-serif"
      >
        K
      </text>
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function AlertCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { t, lang, setLang } = useI18n()

  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotPending, setForgotPending] = useState(false)

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim()
    if (!email) {
      addToast(t('login.forgotEmail.hint'), 'error')
      return
    }
    setForgotPending(true)
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      addToast(t('login.forgotEmail.sent'), 'success')
      setShowForgot(false)
    } finally {
      setForgotPending(false)
    }
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const e = p.get('error')
    if (e) {
      setServerError(decodeURIComponent(e))
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await login(values.email, values.password)
      navigate('/ideas', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      {/* Swiss Grid: 8px base - Centered Card Container */}
      <div className="w-full max-w-md">

        {/* Logo & Branding - Swiss: Clear hierarchy */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <KaizenLogo size={56} />
          </div>
          <h1 className="text-[40px] font-semibold text-neutral-900 leading-tight tracking-tight mb-3">
            Welcome Back
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed">
            Sign in to access your Kaizen dashboard
          </p>
        </div>

        {/* Main Card - Swiss: Clean borders, subtle shadow */}
        <div className="bg-white rounded-[12px] shadow-md border border-neutral-200">
          <div className="p-12">

            {/* Language Selector - Swiss: 8px spacing */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-neutral-700 mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-neutral-500">
                    <GlobeIcon />
                  </div>
                  <span>Language</span>
                </div>
              </label>
              <select
                value={lang}
                onChange={e => setLang(e.target.value as typeof lang)}
                className="w-full h-12 px-4 text-sm border border-neutral-300 rounded-[10px] bg-white text-neutral-900
                           focus:outline-none focus:ring-2 focus:ring-acg-500 focus:border-transparent
                           transition-all"
              >
                <option value="" disabled>Select language</option>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.native} — {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Login Form - Swiss: Consistent 8px rhythm */}
            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6">

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-neutral-500">
                      <UserIcon />
                    </div>
                    <span>Email Address</span>
                  </div>
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Enter your email"
                  className={`w-full h-12 px-4 text-sm border rounded-[10px] bg-white text-neutral-900 placeholder-neutral-400
                             focus:outline-none focus:ring-2 focus:ring-acg-500 focus:border-transparent
                             transition-all
                             ${errors.email ? 'border-danger-500 focus:ring-danger-500' : 'border-neutral-300'}`}
                />
                {errors.email && (
                  <p className="mt-2 text-xs text-danger-600 flex items-center gap-1.5">
                    <AlertCircleIcon />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-neutral-500">
                      <LockIcon />
                    </div>
                    <span>Password</span>
                  </div>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter your password"
                    className={`w-full h-12 px-4 pr-12 text-sm border rounded-[10px] bg-white text-neutral-900 placeholder-neutral-400
                               focus:outline-none focus:ring-2 focus:ring-acg-500 focus:border-transparent
                               transition-all
                               ${errors.password ? 'border-danger-500 focus:ring-danger-500' : 'border-neutral-300'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600
                               transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-xs text-danger-600 flex items-center gap-1.5">
                    <AlertCircleIcon />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me + Forgot Password - Swiss: Left-aligned */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-neutral-300 text-acg-500 focus:ring-acg-500
                               focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-600">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(v => !v)}
                  className="text-sm font-semibold text-neutral-900 hover:text-acg-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Forgot Password Section */}
              {showForgot && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-[10px] p-5 space-y-4">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Enter your email to receive a password reset link
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 h-10 px-3 text-sm border border-neutral-300 rounded-[8px] bg-white
                                 text-neutral-900 placeholder-neutral-400
                                 focus:outline-none focus:ring-2 focus:ring-acg-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => void handleForgotPassword()}
                      disabled={forgotPending}
                      className="h-10 px-5 text-sm font-semibold text-white bg-acg-500 hover:bg-acg-600
                                 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors"
                    >
                      {forgotPending ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}

              {/* Server Error */}
              {serverError && (
                <div className="bg-danger-50 border border-danger-200 rounded-[10px] px-4 py-4
                                flex items-start gap-3">
                  <div className="text-danger-600 mt-0.5">
                    <AlertCircleIcon />
                  </div>
                  <p className="text-sm text-danger-700 flex-1 leading-relaxed">{serverError}</p>
                </div>
              )}

              {/* PRIMARY: Sign In Button - MUST BE VISIBLE */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-13 flex items-center justify-center gap-2 text-[15px] font-semibold tracking-wide
                             text-white bg-acg-500 hover:bg-acg-600 active:bg-acg-700
                             rounded-[10px] shadow-md hover:shadow-lg
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>

              {/* Divider - Swiss: Clean lines */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-neutral-500 uppercase tracking-wider font-medium">
                    Or
                  </span>
                </div>
              </div>

              {/* SECONDARY: Microsoft SSO */}
              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE}/auth/microsoft` }}
                className="w-full h-12 flex items-center justify-center gap-3 text-[15px] font-medium
                           text-neutral-700 bg-white hover:bg-neutral-50
                           border border-neutral-300 rounded-[10px] shadow-sm
                           transition-all"
              >
                <MicrosoftLogo />
                <span>Login with Microsoft</span>
              </button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
              </div>

              {/* TERTIARY: Anonymous Submit */}
              <button
                type="button"
                onClick={() => navigate('/submit-anonymous')}
                className="w-full h-11 text-[14px] font-medium text-neutral-600 hover:text-neutral-900
                           bg-neutral-100 hover:bg-neutral-200 rounded-[10px]
                           transition-all"
              >
                Submit idea without log in
              </button>

            </form>
          </div>
        </div>

        {/* Footer Trust Indicator - Swiss: Simple text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Trusted by ACG teams across all plants
          </p>
        </div>
      </div>
    </div>
  )
}
