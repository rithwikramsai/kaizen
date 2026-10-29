import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Inline SVGs ─────────────────────────────────────────────────────────────

function KietLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="url(#hexGrad)" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif">K</text>
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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

// ─── 3D Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)')

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rx = ((y - cy) / cy) * -8
    const ry = ((x - cx) / cx) * 8
    setTransform(`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`)
  }

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)')
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: 'transform 0.15s ease-out' }}
      className="glass rounded-xl p-4 flex flex-col gap-2 cursor-default select-none"
    >
      <div className="text-indigo-400">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  )
}

// ─── Floating Label Input ────────────────────────────────────────────────────

function FloatingInput({
  id,
  label,
  type,
  registration,
  error,
  rightSlot,
}: {
  id: string
  label: string
  type: string
  registration: ReturnType<ReturnType<typeof useForm>['register']>
  error?: string
  rightSlot?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          id={id}
          type={type}
          {...registration}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false)
            setHasValue(e.target.value.length > 0)
          }}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0)
            ;(registration as { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }).onChange(e)
          }}
          className="input-glow w-full bg-white/5 border border-white/10 text-white placeholder-transparent rounded-xl px-4 pt-5 pb-2 text-sm focus:outline-none focus:border-indigo-500/50 transition-all duration-300 peer"
          placeholder={label}
        />
        <label
          htmlFor={id}
          className={`absolute left-4 transition-all duration-200 pointer-events-none font-medium ${
            focused || hasValue
              ? 'top-1.5 text-[10px] text-indigo-400'
              : 'top-3.5 text-sm text-slate-500'
          }`}
        >
          {label}
        </label>
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

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
    <div className="min-h-screen flex bg-[#0f0f23] overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23]">

        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl animate-pulse-glow" />
          <div className="animate-float-delayed absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl animate-pulse-glow" />
          <div className="animate-float absolute top-2/3 left-1/3 w-48 h-48 rounded-full bg-indigo-400/10 blur-2xl" />
        </div>

        {/* Top logo */}
        <div className="relative flex items-center gap-3 z-10">
          <KietLogo size={36} />
          <div>
            <span className="text-white font-bold text-lg">KIET</span>
            <span className="text-indigo-400 text-sm font-medium ml-1.5">Platform</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Turn Every Idea<br />
              Into{' '}
              <span className="gradient-text">Impact</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-md">
              KIET — Kaizen Idea Excellence Tracker. The platform ACG uses to capture, review, and reward every innovation across all plants.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              }
              label="Ideas Submitted"
              value="1,240"
            />
            <StatCard
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
              label="Approved"
              value="847"
            />
            <StatCard
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              label="Avg. Review Time"
              value="2.3d"
            />
          </div>
        </div>

        {/* Bottom trust line */}
        <div className="relative z-10 flex items-center gap-2 text-slate-500 text-xs">
          <div className="flex -space-x-2">
            {['IN', 'RK', 'PS', 'VN'].map((initials) => (
              <div
                key={initials}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white border border-[#0f0f23]"
              >
                {initials}
              </div>
            ))}
          </div>
          <span>Trusted by ACG teams across all plants</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full md:w-1/2 lg:w-[45%] flex items-center justify-center px-6 py-12 relative">

        {/* Subtle right-panel glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

        <div className="glass rounded-2xl p-8 w-full max-w-md relative z-10">

          {/* Header */}
          <div className="mb-7">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-6 md:hidden">
              <KietLogo size={28} />
              <span className="text-white font-bold">KIET Platform</span>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Welcome back</p>
            <h2 className="text-2xl font-bold text-white">Sign in to KIET</h2>
            <div className="mt-2 w-10 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
          </div>

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">

            {/* Email */}
            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              registration={register('email')}
              error={errors.email?.message}
            />

            {/* Password */}
            <FloatingInput
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              registration={register('password')}
              error={errors.password?.message}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-500 hover:text-indigo-400 transition-colors duration-200"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              }
            />

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-1 cursor-pointer accent-indigo-500"
                />
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => addToast('Password reset link will be sent to your email — coming soon.', 'info')}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                {serverError}
              </div>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-1"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {/* SSO divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* SSO buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addToast('SSO login is coming soon. Use email & password for now.', 'info')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 text-slate-300 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <GoogleLogo />
                Google
              </button>
              <button
                type="button"
                onClick={() => addToast('SSO login is coming soon. Use email & password for now.', 'info')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 text-slate-300 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MicrosoftLogo />
                Microsoft
              </button>
            </div>

            {/* Anonymous submit */}
            <button
              type="button"
              onClick={() => navigate('/submit-anonymous')}
              className="w-full border border-dashed border-white/20 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-400 rounded-xl py-2.5 text-sm transition-all duration-300 hover:bg-indigo-500/5"
            >
              💡 Submit an idea without signing in →
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
