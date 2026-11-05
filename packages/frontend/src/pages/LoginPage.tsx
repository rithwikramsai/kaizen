import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../hooks/useToast.js'
import { t } from '../i18n/index.js'

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
    }} className="rounded-2xl p-4 flex flex-col gap-1.5 cursor-default select-none">
      <div className="text-white/65 mb-0.5">{icon}</div>
      <div className="text-[1.6rem] font-extrabold text-white tracking-tight leading-none">{value}</div>
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
        background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: focused ? `1.5px solid rgba(232,41,74,0.7)` : '1.5px solid rgba(255,255,255,0.1)',
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
@keyframes kz-left  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
@keyframes kz-right { from { opacity:0; transform:translateX(40px);  } to { opacity:1; transform:translateX(0); } }
@keyframes kz-up    { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
@keyframes kz-glow  { 0%,100%{opacity:0.7} 50%{opacity:1} }
@keyframes kz-float { 0%,100%{transform:translateY(0) rotate(-0.8deg)} 50%{transform:translateY(-22px) rotate(0.8deg)} }
@keyframes kz-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
.kz-left  { animation: kz-left  0.7s cubic-bezier(0.22,1,0.36,1) both; }
.kz-right { animation: kz-right 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-1  { animation: kz-up 0.55s 0.05s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-2  { animation: kz-up 0.55s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-3  { animation: kz-up 0.55s 0.25s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-4  { animation: kz-up 0.55s 0.35s cubic-bezier(0.22,1,0.36,1) both; }
.kz-up-5  { animation: kz-up 0.55s 0.45s cubic-bezier(0.22,1,0.36,1) both; }
.kz-glow  { animation: kz-glow 2.5s ease-in-out infinite; }
.kz-float { animation: kz-float 4s ease-in-out infinite; }
.kz-spin  { animation: kz-spin 8s linear infinite; transform-origin: 238px 150px; }
`

const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api/v1'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotPending, setForgotPending] = useState(false)

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
        <div className="hidden md:flex md:w-1/2 lg:w-[56%] relative flex-col justify-between overflow-hidden kz-left"
          style={{ background: 'linear-gradient(148deg, #ff4d6d 0%, #e8294a 48%, #b5162a 100%)' }}>

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
            <div className="flex items-center gap-3">
              <KaizenLogo size={38}/>
              <div className="border-l border-white/30 pl-3">
                <div className="text-white font-bold text-[15px] leading-tight">Kaizen — Ideas That Fly</div>
                <div className="text-white/65 text-[11px] font-medium tracking-wide">Kaizen Idea Excellence Tracker</div>
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="relative z-10 flex flex-col gap-6 px-10">
            {/* Illustration */}
            <div className="flex justify-center kz-float" style={{ marginBottom: -8 }}>
              <svg viewBox="0 0 360 210" width="100%" style={{ maxWidth: 340 }} fill="none">
                <path d="M20 200 L88 200 L88 165 L146 165 L146 130 L204 130 L204 95 L262 95 L262 58 L330 58"
                  stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M28 190 L90 190 L90 155 L148 155 L148 120 L206 120 L206 85 L264 85 L264 48 L338 48"
                  stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <polygon points="338,48 322,40 322,56" fill="white"/>
                {([[90,172],[206,102]] as [number,number][]).map(([cx,cy],i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="12" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5"/>
                    <path d={`M${cx-5} ${cy} L${cx-1} ${cy+4} L${cx+6} ${cy-5}`} stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </g>
                ))}
                <circle cx="302" cy="26" r="10" fill="white" opacity="0.9"/>
                <path d="M302 36 L302 55 M293 42 L311 42 M302 55 L295 69 M302 55 L309 69"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M290 20 Q290 8 300 8 L304 8 Q314 8 314 20 Q314 30 302 35 Q290 30 290 20Z"
                  fill="rgba(255,218,68,0.92)" stroke="rgba(255,195,30,0.8)" strokeWidth="1"/>
                <path d="M299 35 L305 35 L303 42 L301 42Z" fill="rgba(255,218,68,0.92)"/>
                <path d="M297 42 L307 42" stroke="rgba(255,218,68,0.92)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="55" cy="148" r="17" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"/>
                <path d="M55 137 Q61 133 67 137 Q72 142 70 148 L70 154 L40 154 L40 148 Q38 142 43 137 Q49 133 55 137Z"
                  fill="white" opacity="0.82"/>
                <path d="M41 154 L69 154 M43 158 L67 158" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <g style={{ transformOrigin: '238px 150px', animation: 'kz-spin 10s linear infinite' }} opacity="0.65">
                  <g transform="translate(238,150)">
                    <circle cx="0" cy="0" r="14" fill="none" stroke="white" strokeWidth="1.8"/>
                    <circle cx="0" cy="0" r="5.5" fill="rgba(255,255,255,0.28)" stroke="white" strokeWidth="1.5"/>
                    {[0,45,90,135,180,225,270,315].map((a,i) => (
                      <rect key={i} x="-2.5" y="-16.5" width="5" height="5" fill="white" transform={`rotate(${a})`} rx="1.5"/>
                    ))}
                  </g>
                </g>
                <g transform="translate(173,180)" opacity="0.5">
                  <path d="M-9 -13 L9 -13 L0 0 L9 13 L-9 13 L0 0Z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                  <line x1="-9" y1="-13" x2="9" y2="-13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="-9" y1="13" x2="9" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
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
        <div className="w-full md:w-1/2 lg:w-[44%] relative flex items-center justify-center px-12 py-10 kz-right"
          style={{ background: 'linear-gradient(160deg, #13131a 0%, #0e0e12 60%, #12090c 100%)' }}>

          {/* Red colonization — wide bleed from the seam, fading to nothing */}
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none kz-glow" style={{
            width: '75%',
            background: 'linear-gradient(90deg, rgba(232,41,74,0.38) 0%, rgba(232,41,74,0.18) 25%, rgba(232,41,74,0.07) 55%, transparent 100%)',
          }}/>
          {/* Second softer layer for smooth colour transition */}
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none" style={{
            width: '50%',
            background: 'linear-gradient(90deg, rgba(184,20,45,0.22) 0%, rgba(232,41,74,0.06) 60%, transparent 100%)',
          }}/>
          {/* Top bleed — red tints the ceiling near the seam */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
            height: '35%',
            background: 'linear-gradient(180deg, rgba(232,41,74,0.1) 0%, transparent 100%)',
          }}/>
          {/* Bottom corner accent */}
          <div className="absolute bottom-0 left-0 pointer-events-none" style={{
            width: 280, height: 280,
            background: 'radial-gradient(circle at bottom left, rgba(232,41,74,0.18) 0%, transparent 70%)',
          }}/>

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
            </div>

            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-5 kz-up-2">

              <FloatingField
                id="email" label={t('login.email')} type="email"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
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
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }}/>
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }}/>
              </div>

              {/* SSO + Sign In */}
              <div className="flex gap-3">
                <Btn3D variant="outline" type="button" className="flex-1 py-[14px] text-[14px]"
                  onClick={() => { window.location.href = `${API_BASE}/auth/microsoft` }}>
                  <MicrosoftLogo/>
                  <span>{t('login.microsoft')}</span>
                </Btn3D>
                <Btn3D variant="primary" type="submit" disabled={isSubmitting} className="flex-1 py-[14px] text-[14px]">
                  {isSubmitting
                    ? <><Spinner/><span>{t('login.submitting')}</span></>
                    : <span>→&nbsp;{t('login.submit')}</span>}
                </Btn3D>
              </div>

              {/* Anonymous */}
              <Btn3D variant="ghost" type="button" className="w-full py-[13px] text-[13.5px]"
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
