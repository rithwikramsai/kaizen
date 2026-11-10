import { useState, useRef, useEffect } from 'react'
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

const RED = '#e8294a'
const RED_DARK = '#c0182f'

// ─── 3D tilt hook ─────────────────────────────────────────────────────────────
function useTilt(strength = 9) {
  const ref = useRef<HTMLButtonElement>(null)
  const [s, setS] = useState<React.CSSProperties>({})
  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const rx = (((e.clientY - r.top) / r.height) - 0.5) * -strength * 2
    const ry = (((e.clientX - r.left) / r.width) - 0.5) * strength * 2
    setS({ transform: `perspective(500px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px) scale(1.04)`, transition: 'transform 0.08s ease-out' })
  }
  const onLeave = () => setS({ transform: 'perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)', transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)' })
  return { ref, style: s, onMouseMove: onMove, onMouseLeave: onLeave }
}

// ─── SVGs ─────────────────────────────────────────────────────────────────────
function KaizenLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="17"
        fontWeight="800" fontFamily="Inter,sans-serif">K</text>
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Glassmorphism Stat Card ───────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [s, setS] = useState<React.CSSProperties>({})
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const rx = (((e.clientY - r.top) / r.height) - 0.5) * -18
    const ry = (((e.clientX - r.left) / r.width) - 0.5) * 18
    setS({ transform: `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px) scale(1.05)`, transition: 'transform 0.08s ease-out' })
  }
  const onLeave = () => setS({ transform: 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)', transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)' })

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{
      ...s,
      background: 'rgba(255,255,255,0.11)',
      border: '1px solid rgba(255,255,255,0.25)',
      borderTop: '1px solid rgba(255,255,255,0.42)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.28)',
    }} className="rounded-2xl py-5 px-4 flex flex-col gap-2 cursor-default select-none">
      <div className="text-white/65 mb-0.5">{icon}</div>
      <div className="text-3xl font-extrabold text-white tracking-tight leading-none">{value}</div>
      <div className="text-[10px] text-white/60 font-semibold uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  )
}

// ─── 3D Button ────────────────────────────────────────────────────────────────
type Btn3DProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
}
function Btn3D({ variant = 'primary', children, style, className = '', ...rest }: Btn3DProps) {
  const tilt = useTilt(7)
  const base: React.CSSProperties =
    variant === 'primary' ? {
      background: `linear-gradient(155deg, #ff4d6d 0%, ${RED} 40%, ${RED_DARK} 100%)`,
      boxShadow: `0 4px 24px rgba(232,41,74,0.45), inset 0 1px 0 rgba(255,255,255,0.2)`,
      color: 'white', border: 'none',
    } : variant === 'outline' ? {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.18)',
      color: 'rgba(255,255,255,0.85)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
    } : {
      background: 'rgba(232,41,74,0.1)',
      border: `1px solid rgba(232,41,74,0.3)`,
      color: 'rgba(232,41,74,0.9)',
      boxShadow: 'none',
    }

  const hoverShadow =
    variant === 'primary' ? '0 10px 36px rgba(232,41,74,0.6)' :
    variant === 'outline' ? '0 4px 20px rgba(0,0,0,0.25)' :
    '0 4px 16px rgba(232,41,74,0.2)'

  const [hovered, setHovered] = useState(false)

  return (
    <button
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={(e) => { tilt.onMouseLeave(e); setHovered(false) }}
      onMouseEnter={() => setHovered(true)}
      style={{
        ...base,
        ...(hovered ? { boxShadow: hoverShadow } : {}),
        ...tilt.style,
        ...style,
      }}
      className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-[box-shadow] duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

// ─── Dark floating-label input ────────────────────────────────────────────────
function FloatingField({
  id, label, type, icon, registration, error, rightSlot,
}: {
  id: string; label: string; type: string; icon: React.ReactNode
  registration: ReturnType<ReturnType<typeof useForm>['register']>
  error?: string; rightSlot?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  const [hasVal, setHasVal] = useState(false)
  const lifted = focused || hasVal

  return (
    <div className="flex flex-col gap-1">
      <div className="relative rounded-xl transition-all duration-200" style={{
        background: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: focused ? `1.5px solid rgba(232,41,74,0.7)` : '1.5px solid rgba(255,255,255,0.08)',
        boxShadow: focused ? `0 0 0 3px rgba(232,41,74,0.14), 0 2px 12px rgba(232,41,74,0.1)` : 'none',
      }}>
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: focused ? `rgba(232,41,74,0.8)` : 'rgba(255,255,255,0.3)' }}>{icon}</span>
        <input
          id={id} type={type}
          {...registration}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); setHasVal(e.target.value.length > 0) }}
          onChange={(e) => {
            setHasVal(e.target.value.length > 0)
            ;(registration as { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }).onChange(e)
          }}
          placeholder=" "
          className="w-full bg-transparent pl-11 pr-11 pt-6 pb-2.5 text-[14px] rounded-xl focus:outline-none placeholder-transparent"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        />
        <label htmlFor={id} className="absolute left-10 pointer-events-none font-medium transition-all duration-200" style={{
          top: lifted ? '6px' : '50%',
          transform: lifted ? 'translateY(0)' : 'translateY(-50%)',
          fontSize: lifted ? '10px' : '13px',
          color: lifted ? `rgba(232,41,74,0.9)` : 'rgba(255,255,255,0.35)',
          letterSpacing: lifted ? '0.04em' : 'normal',
        }}>
          {label}
        </label>
        {rightSlot && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
      {error && <p className="text-[11px] pl-1 mt-0.5" style={{ color: '#ff6b6b' }}>{error}</p>}
    </div>
  )
}

// ─── CSS animations ────────────────────────────────────────────────────────────
const CSS = `
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 9999px #1a0d10 inset !important;
  box-shadow: 0 0 0 9999px #1a0d10 inset !important;
  -webkit-text-fill-color: rgba(255,255,255,0.9) !important;
  caret-color: rgba(255,255,255,0.9);
  transition: background-color 99999s ease-in-out 0s;
}
@keyframes kz-left  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
@keyframes kz-right { from { opacity:0; transform:translateX(40px);  } to { opacity:1; transform:translateX(0); } }
@keyframes kz-up    { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
@keyframes kz-glow  { 0%,100%{opacity:0.75} 50%{opacity:1} }
@keyframes kz-float { 0%,100%{transform:translateY(0) rotate(-0.8deg)} 50%{transform:translateY(-22px) rotate(0.8deg)} }
@keyframes kz-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes kz-drift { 0%{transform:translateY(0) translateX(0);opacity:0} 10%{opacity:1} 50%{transform:translateY(-60px) translateX(8px);opacity:0.7} 90%{opacity:0.3} 100%{transform:translateY(-130px) translateX(-6px);opacity:0} }
@keyframes kz-draw  { to { stroke-dashoffset: 0; } }
@keyframes kz-fadein { from{opacity:0} to{opacity:1} }
@keyframes kz-bulb-pulse { 0%,100%{opacity:1;filter:drop-shadow(0 0 7px rgba(255,255,255,0.95))} 45%,55%{opacity:0.2;filter:drop-shadow(0 0 0px rgba(255,255,255,0))} }
.kz-left  { animation: kz-left  0.7s cubic-bezier(0.22,1,0.36,1) both; }
.kz-right { animation: kz-right 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-1  { animation: kz-up 0.55s 0.05s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-2  { animation: kz-up 0.55s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-3  { animation: kz-up 0.55s 0.25s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-4  { animation: kz-up 0.55s 0.35s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-5  { animation: kz-up 0.55s 0.45s cubic-bezier(0.22,1,0.36,1) both; }
.kz-glow  { animation: kz-glow 2.5s ease-in-out infinite; }
.kz-float { animation: kz-float 4s ease-in-out infinite; }
.kz-spin  { animation: kz-spin 10s linear infinite; transform-origin: 238px 150px; }
`

const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

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
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 })
  const rightPanelRef = useRef<HTMLDivElement>(null)

  const handleRightMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = rightPanelRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    setSpotlight({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    })
  }

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim()
    if (!email) { addToast(t('login.forgotEmail.hint'), 'error'); return }
    setForgotPending(true)
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      addToast(t('login.forgotEmail.sent'), 'success')
      setShowForgot(false)
    } finally { setForgotPending(false) }
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const e = p.get('error')
    if (e) { setServerError(decodeURIComponent(e)); window.history.replaceState({}, '', '/login') }
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
    <>
      <style>{CSS}</style>
      <div className="min-h-screen flex overflow-hidden" style={{ background: '#0e0e12' }}>

        {/* ══ LEFT PANEL — Red gradient ══════════════════════════════════════ */}
        <div className="hidden md:flex md:w-1/2 lg:w-[56%] relative flex-col overflow-hidden kz-left"
          style={{
            background: 'linear-gradient(148deg, #ff4d6d 0%, #e8294a 48%, #b5162a 100%)',
            clipPath: 'polygon(0 0, 94% 0, 100% 100%, 0 100%)',
          }}>

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)',
            backgroundSize: '30px 30px', opacity: 0.3,
          }}/>
          {/* Orbs */}
          <div className="absolute -top-28 -right-28 w-[26rem] h-[26rem] rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }}/>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.07)' }}/>

          {/* Logo */}
          <div className="relative z-10 p-10 pb-0 kz-up-1">
            <div className="flex items-center gap-4">
              <KaizenLogo size={52}/>
              <div className="border-l-2 border-white/40 pl-4" style={{ boxShadow: '0 0 18px rgba(255,255,255,0.08)' }}>
                <div className="text-white font-extrabold text-[22px] leading-tight tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
                  Kaizen — Ideas That Fly
                </div>
                <div className="text-white/80 text-[13px] font-semibold tracking-widest uppercase mt-0.5">
                  Kaizen Idea Excellence Tracker
                </div>
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="relative z-10 flex flex-col gap-6 px-10 flex-1 justify-center py-4">
            {/* Illustration */}
            <div className="flex justify-center kz-float" style={{ marginBottom: -8 }}>
              <svg viewBox="0 0 360 210" width="100%" style={{ maxWidth: 440 }} fill="none">

                {/* Shadow stair — draws itself */}
                <path d="M20 200 L88 200 L88 165 L146 165 L146 130 L204 130 L204 95 L262 95 L262 58 L330 58"
                  stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray="900" strokeDashoffset="900"
                  style={{ animation: 'kz-draw 1.4s 0.2s cubic-bezier(0.4,0,0.2,1) forwards' }}/>

                {/* Main arrow path — draws itself with a slight delay */}
                <path d="M28 190 L90 190 L90 155 L148 155 L148 120 L206 120 L206 85 L264 85 L264 48 L338 48"
                  stroke="white" strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray="920" strokeDashoffset="920"
                  style={{ animation: 'kz-draw 1.2s 0.05s cubic-bezier(0.4,0,0.2,1) forwards' }}/>

                {/* Arrowhead — fades in after path finishes drawing */}
                <polygon points="338,48 322,40 322,56" fill="white"
                  style={{ opacity: 0, animation: 'kz-fadein 0.3s 1.2s forwards' }}/>

                {/* ── STEP 1 (x=59, y=175): Lightbulb — Idea Submission ── */}
                <g style={{ opacity: 0, animation: 'kz-fadein 0.4s 0.3s forwards' }}>
                  {/* outer glow ring pulses in sync */}
                  <circle cx="59" cy="175" r="18" fill="rgba(255,255,255,0.07)"
                    style={{ animation: 'kz-bulb-pulse 2.4s 1.5s ease-in-out infinite' }}/>
                  {/* badge circle */}
                  <circle cx="59" cy="175" r="13" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"
                    style={{ animation: 'kz-bulb-pulse 2.4s 1.5s ease-in-out infinite' }}/>
                  {/* proper lightbulb: circle globe + neck + base ridges */}
                  <g style={{ animation: 'kz-bulb-pulse 2.4s 1.5s ease-in-out infinite' }}>
                    {/* glass globe — circle */}
                    <circle cx="59" cy="171" r="6" fill="white" opacity="0.9"/>
                    {/* neck connecting globe to base */}
                    <path d="M55.5 176 L55.5 179 Q59 180.5 62.5 179 L62.5 176Z" fill="white" opacity="0.88"/>
                    {/* base ridge 1 */}
                    <rect x="55" y="179" width="8" height="2" rx="1" fill="white" opacity="0.85"/>
                    {/* base ridge 2 — slightly narrower */}
                    <rect x="56" y="181.5" width="6" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
                  </g>
                </g>

                {/* ── STEP 2 (x=119, y=140): Hourglass — Under Review ── */}
                {/* cy = 155 - 13 - 2 = 140 */}
                <g transform="translate(119,140)" opacity="0" style={{ animation: 'kz-fadein 0.4s 0.5s forwards' }}>
                  <circle cx="0" cy="0" r="13" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                  <path d="M-6 -8 L6 -8 L0 0 L6 8 L-6 8 L0 0Z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                  <line x1="-6" y1="-8" x2="6" y2="-8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="-6" y1="8"  x2="6" y2="8"  stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </g>

                {/* ── STEP 3 (x=177, y=105): Checkmark — Approved ── */}
                {/* cy = 120 - 13 - 2 = 105 */}
                <g style={{ opacity: 0, animation: 'kz-fadein 0.4s 0.7s forwards' }}>
                  <circle cx="177" cy="105" r="13" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                  <path d="M172 105 L175 108.5 L183 99" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </g>

                {/* ── STEP 4 (x=235, y=70): Gear — Implementation ── */}
                {/* cy = 85 - 13 - 2 = 70 */}
                <g style={{ opacity: 0, animation: 'kz-fadein 0.4s 0.9s forwards' }}>
                  <circle cx="235" cy="70" r="13" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
                  <g style={{ transformOrigin: '235px 70px', animation: 'kz-spin 10s linear infinite' }}>
                    <g transform="translate(235,70)">
                      <circle cx="0" cy="0" r="4" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.4"/>
                      {[0,45,90,135,180,225,270,315].map((a,i) => (
                        <rect key={i} x="-1.8" y="-9" width="3.6" height="3.6" fill="white" transform={`rotate(${a})`} rx="1"/>
                      ))}
                    </g>
                  </g>
                </g>

                {/* ── STEP 5 (top, y=48): Bar chart — Results ── */}
                {/* bars sit above the top landing, baseline at y=48 */}
                <g style={{ opacity: 0, animation: 'kz-fadein 0.5s 1.1s forwards' }}>
                  <rect x="278" y="34" width="6" height="14" rx="2" fill="rgba(255,255,255,0.45)"/>
                  <rect x="287" y="27" width="6" height="21" rx="2" fill="rgba(255,255,255,0.6)"/>
                  <rect x="296" y="19" width="6" height="29" rx="2" fill="rgba(255,255,255,0.75)"/>
                  <rect x="305" y="10" width="6" height="38" rx="2" fill="rgba(255,255,255,0.92)"/>
                  <path d="M281 33 L290 26 L299 18 L308 9" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <polygon points="308,9 302,10 305,15" fill="rgba(255,255,255,0.65)"/>
                </g>

              </svg>
            </div>

            <div className="flex flex-col gap-3 kz-up-2">
              <h1 className="text-[2.65rem] font-extrabold text-white leading-[1.08] tracking-tight">
                Transform Your<br/>Operations Excellence
              </h1>
              <p className="text-white/72 text-[13px] leading-relaxed max-w-[400px]">
                Kaizen — Kaizen Idea Excellence Tracker. The platform ACG uses to capture, review, and reward every innovation across all plants.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 kz-up-3">
              <StatCard icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>} label="Ideas Submitted" value="1,240"/>
              <StatCard icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>} label="Approved" value="847"/>
              <StatCard icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} label="Avg. Review Time" value="2.3d"/>
            </div>
          </div>

          {/* Trust + wave */}
          <div className="relative z-10 kz-up-4">
            <div className="px-10 pb-0">
              <div className="flex items-center gap-2 text-white/55 text-[11px]">
                <div className="flex -space-x-2">
                  {['IN','RK','PS','VN'].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white/25"
                      style={{ background: 'rgba(255,255,255,0.2)' }}>{i}</div>
                  ))}
                </div>
                <span>Trusted by ACG teams across all plants</span>
              </div>
            </div>
            <div style={{ height: 60, marginTop: 16, overflow: 'hidden' }}>
              <svg viewBox="0 0 640 60" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                <path d="M0,18 Q160,50 320,18 Q480,-14 640,18 L640,60 L0,60 Z" fill="rgba(255,255,255,0.07)"/>
                <path d="M0,30 Q160,5 320,30 Q480,55 640,30 L640,60 L0,60 Z" fill="rgba(255,255,255,0.05)"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL — Dark premium ═════════════════════════════════════ */}
        <div
          ref={rightPanelRef}
          onMouseMove={handleRightMouseMove}
          className="w-full md:w-1/2 lg:w-[44%] relative flex items-center justify-center px-12 py-10 kz-right"
          style={{ background: 'linear-gradient(160deg, #13131a 0%, #0e0e12 60%, #12090c 100%)' }}>

          {/* ── Cursor spotlight ── */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle 380px at ${spotlight.x}% ${spotlight.y}%, rgba(232,41,74,0.09) 0%, rgba(232,41,74,0.03) 45%, transparent 70%)`,
            transition: 'background 0.08s ease-out',
          }}/>

          {/* ── Background depth layers ── */}
          {/* Noise/grain texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}/>
          {/* Subtle dot grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}/>
          {/* Red colonization — wide bleed from the seam */}
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none kz-glow" style={{
            width: '80%',
            background: 'linear-gradient(90deg, rgba(232,41,74,0.42) 0%, rgba(232,41,74,0.2) 22%, rgba(232,41,74,0.08) 50%, transparent 100%)',
          }}/>
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none" style={{
            width: '55%',
            background: 'linear-gradient(90deg, rgba(184,20,45,0.25) 0%, rgba(232,41,74,0.07) 60%, transparent 100%)',
          }}/>
          {/* Top ceiling tint */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
            height: '40%',
            background: 'linear-gradient(180deg, rgba(232,41,74,0.12) 0%, transparent 100%)',
          }}/>
          {/* Bottom-left radial anchor */}
          <div className="absolute bottom-0 left-0 pointer-events-none" style={{
            width: 320, height: 320,
            background: 'radial-gradient(circle at bottom left, rgba(232,41,74,0.2) 0%, transparent 70%)',
          }}/>
          {/* Top-right counter-glow for depth */}
          <div className="absolute top-0 right-0 pointer-events-none" style={{
            width: 260, height: 260,
            background: 'radial-gradient(circle at top right, rgba(140,10,30,0.15) 0%, transparent 70%)',
          }}/>

          {/* ── 18 floating red particles ── */}
          {[
            { x:8,  b:12, s:2.5, dur:9,  del:0   },
            { x:18, b:55, s:2,   dur:12, del:1.5  },
            { x:28, b:30, s:3,   dur:10, del:3    },
            { x:38, b:70, s:2,   dur:14, del:0.8  },
            { x:48, b:20, s:3.5, dur:8,  del:2.5  },
            { x:58, b:80, s:2,   dur:11, del:4    },
            { x:68, b:45, s:2.5, dur:13, del:1    },
            { x:78, b:65, s:3,   dur:9,  del:3.5  },
            { x:88, b:35, s:2,   dur:10, del:0.3  },
            { x:12, b:88, s:1.5, dur:15, del:2    },
            { x:22, b:15, s:2,   dur:11, del:5    },
            { x:32, b:50, s:3,   dur:7,  del:1.2  },
            { x:52, b:90, s:2.5, dur:12, del:4.5  },
            { x:62, b:8,  s:2,   dur:9,  del:0.6  },
            { x:72, b:75, s:3.5, dur:10, del:3.2  },
            { x:82, b:25, s:2,   dur:13, del:2.8  },
            { x:42, b:60, s:2,   dur:16, del:1.8  },
            { x:92, b:48, s:2.5, dur:8,  del:5.5  },
          ].map((p, i) => (
            <div key={i} className="absolute pointer-events-none rounded-full" style={{
              left: `${p.x}%`,
              bottom: `${p.b % 85}%`,
              width: p.s,
              height: p.s,
              background: `rgba(232,41,74,${0.25 + (i % 4) * 0.12})`,
              boxShadow: `0 0 ${p.s * 3}px rgba(232,41,74,0.4)`,
              animation: `kz-drift ${p.dur}s ${p.del}s ease-in-out infinite`,
            }}/>
          ))}

          {/* Faint K watermark */}
          <div className="absolute top-6 right-8 pointer-events-none select-none"
            style={{ fontSize: 140, fontWeight: 900, color: 'rgba(232,41,74,0.045)', lineHeight: 1, fontFamily: 'Inter,sans-serif' }}>
            K
          </div>

          {/* Form — no card, straight on dark background */}
          <div className="relative z-10 w-full max-w-[480px] flex flex-col gap-8">

            {/* Mobile logo */}
            <div className="flex items-center gap-2 md:hidden kz-up-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: RED }}>
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Kaizen Platform</span>
            </div>

            {/* Heading */}
            <div className="kz-up-1">
              <h2 className="text-[2.75rem] font-extrabold leading-[1.05] tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {t('login.welcome')}
              </h2>
              <p className="text-[15px] mt-2.5 font-medium" style={{ color: 'rgba(255,255,255,0.42)' }}>
                {t('login.title')}
              </p>
              <div className="mt-4 h-[3px] w-14 rounded-full" style={{ background: `linear-gradient(90deg,${RED},${RED_DARK})` }}/>

              {/* Language selector — standalone row, BRD §2.3 */}
              <div className="relative mt-5">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <select
                  value={lang}
                  onChange={e => setLang(e.target.value as typeof lang)}
                  className="w-full appearance-none rounded-xl pl-10 pr-9 py-3 text-[14px] font-medium focus:outline-none cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  <option value="" disabled style={{ background: '#1a0d10', color: 'rgba(255,255,255,0.4)' }}>
                    {t('lang.select')}
                  </option>
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} style={{ background: '#1a0d10', color: 'white' }}>
                      {l.native} — {l.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>
            </div>

            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-5 kz-up-2">

              <FloatingField
                id="email" label={t('login.username')} type="email"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                registration={register('email')}
                error={errors.email?.message}
              />

              <FloatingField
                id="password" label={t('login.password')} type={showPassword ? 'text' : 'password'}
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                registration={register('password')}
                error={errors.password?.message}
                rightSlot={
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    style={{ color: 'rgba(255,255,255,0.3)' }} className="hover:text-white transition-colors">
                    <EyeIcon open={showPassword}/>
                  </button>
                }
              />

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" {...register('rememberMe')}
                    className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: RED, borderColor: 'rgba(255,255,255,0.15)' }}/>
                  <span className="text-[13.5px] transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {t('login.rememberMe')}
                  </span>
                </label>
                <button type="button" onClick={() => setShowForgot(v => !v)}
                  className="text-[13.5px] font-semibold transition-opacity hover:opacity-75"
                  style={{ color: RED }}>
                  {t('login.forgotPassword')}
                </button>
              </div>

              {/* Forgot email */}
              {showForgot && (
                <div className="flex gap-2 p-3 rounded-xl" style={{ background: 'rgba(232,41,74,0.08)', border: '1px solid rgba(232,41,74,0.2)' }}>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder={t('login.forgotEmail.placeholder')}
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}/>
                  <Btn3D variant="primary" type="button" onClick={() => void handleForgotPassword()} disabled={forgotPending}
                    style={{ minWidth: 64, padding: '8px 16px' }}>
                    {forgotPending ? '…' : t('login.forgotEmail.send')}
                  </Btn3D>
                </div>
              )}

              {/* Error */}
              {serverError && (
                <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2"
                  style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff8a8a' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {serverError}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.13)' }}/>
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.13)' }}/>
              </div>

              {/* SSO + Sign In — BRD §2.1 layout */}
              <div className="flex gap-3">
                <Btn3D variant="outline" type="button" className="flex-1 py-[14px] text-[14px]"
                  onClick={() => { window.location.href = `${API_BASE}/auth/microsoft` }}>
                  <MicrosoftLogo/>
                  <span>{t('login.microsoft')}</span>
                </Btn3D>
                <Btn3D variant="primary" type="submit" disabled={isSubmitting} className="flex-1 py-[14px] text-[14px]">
                  {isSubmitting
                    ? <><Spinner/><span>{t('login.submitting')}</span></>
                    : <><span>→</span><span>{t('login.submit')}</span></>}
                </Btn3D>
              </div>

              {/* Divider before anonymous — BRD shows clear separation */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}/>
              </div>

              {/* Anonymous submit — BRD §2.1: prominent full-width solid red, primary CTA for plant associates */}
              <Btn3D variant="primary" type="button" className="w-full py-[14px] text-[14px]"
                onClick={() => navigate('/submit-anonymous')}>
                {t('login.anonymousSubmit')}
              </Btn3D>

            </form>
          </div>
        </div>

      </div>
    </>
  )
}
