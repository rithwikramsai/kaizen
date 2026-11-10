import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n, LANGUAGES } from '../../i18n/index.js'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  lookupEmployee,
  getPublicMasterData,
  submitPublicIdea,
  uploadPublicFile,
  trackPublicIdea,
  type PublicEmployeeProfile,
  type PublicSubmitResult,
  type PublicIdeaTrackResult,
} from '../../api/public.js'
import { MicButton } from '../../components/MicButton.js'

// ─── Theme ────────────────────────────────────────────────────────────────────
const RED = '#e8294a'
const RED_DARK = '#c0182f'

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus {
  -webkit-box-shadow:0 0 0 9999px #07070d inset !important;
  -webkit-text-fill-color:rgba(255,255,255,0.9) !important;
  caret-color:rgba(255,255,255,0.9);
  transition:background-color 99999s;
}
@keyframes kz-drift{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:1}50%{transform:translateY(-60px) translateX(8px);opacity:0.7}90%{opacity:0.3}100%{transform:translateY(-130px) translateX(-6px);opacity:0}}
@keyframes kz-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes kz-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes kz-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.85)}}
@keyframes kz-confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-120px) rotate(720deg);opacity:0}}
@keyframes kz-breathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
@keyframes kz-btn-pulse{0%,100%{box-shadow:0 8px 32px rgba(232,41,74,0.35),inset 0 1px 0 rgba(255,255,255,0.2)}50%{box-shadow:0 12px 48px rgba(232,41,74,0.55),inset 0 1px 0 rgba(255,255,255,0.2)}}
@keyframes kz-shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
@keyframes kz-step-pop{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes kz-noise{0%,100%{opacity:0.97}50%{opacity:1}}
@keyframes kz-gradient-shift{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(30deg)}}
@keyframes kz-border-flow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.kz-up-1{animation:kz-up 0.6s 0.05s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-2{animation:kz-up 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-3{animation:kz-up 0.6s 0.25s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-4{animation:kz-up 0.6s 0.35s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-5{animation:kz-up 0.6s 0.45s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-6{animation:kz-up 0.6s 0.55s cubic-bezier(0.22,1,0.36,1) both}
select option{background:#0d0d18;color:rgba(255,255,255,0.9)}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:rgba(255,255,255,0.02)}
::-webkit-scrollbar-thumb{background:rgba(232,41,74,0.35);border-radius:4px}
.kz-card{transition:border 0.35s cubic-bezier(0.4,0,0.2,1),box-shadow 0.35s cubic-bezier(0.4,0,0.2,1),transform 0.35s cubic-bezier(0.4,0,0.2,1)}
.kz-input-shimmer{position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,41,74,0.9),rgba(255,120,150,1),rgba(232,41,74,0.9),transparent);background-size:300% 100%;animation:kz-shimmer 2.2s linear infinite;border-radius:12px 12px 0 0}
`

// ─── 3D Tilt hook ─────────────────────────────────────────────────────────────
function useTilt(strength = 7) {
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

// ─── 3D Button (kept for SuccessScreen / TrackPanel) ─────────────────────────
type Btn3DProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' }
function Btn3D({ variant = 'primary', children, style, className = '', ...rest }: Btn3DProps) {
  const tilt = useTilt(6)
  const [hovered, setHovered] = useState(false)
  const base: React.CSSProperties = variant === 'primary' ? {
    background: `linear-gradient(155deg,#ff4d6d 0%,${RED} 40%,${RED_DARK} 100%)`,
    boxShadow: `0 4px 24px rgba(232,41,74,0.45),inset 0 1px 0 rgba(255,255,255,0.2)`,
    color: 'white', border: 'none',
  } : variant === 'outline' ? {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)',
    color: 'rgba(255,255,255,0.85)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
  } : {
    background: 'rgba(232,41,74,0.1)', border: `1px solid rgba(232,41,74,0.3)`,
    color: 'rgba(232,41,74,0.9)', boxShadow: 'none',
  }
  return (
    <button ref={tilt.ref} onMouseMove={tilt.onMouseMove}
      onMouseLeave={() => { tilt.onMouseLeave(); setHovered(false) }}
      onMouseEnter={() => setHovered(true)}
      style={{ ...base, ...(hovered && variant === 'primary' ? { boxShadow: '0 10px 36px rgba(232,41,74,0.6)' } : {}), ...tilt.style, ...style }}
      className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-[box-shadow] duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}>{children}</button>
  )
}

// ─── Dark floating-label input ────────────────────────────────────────────────
function DarkInput({
  id, label, type = 'text', value, onChange, onKeyDown, readOnly, icon, rightSlot, error, autoFilled,
}: {
  id: string; label: string; type?: string; value: string
  onChange?: (v: string) => void; onKeyDown?: React.KeyboardEventHandler
  readOnly?: boolean; icon?: React.ReactNode
  rightSlot?: React.ReactNode; error?: string; autoFilled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  return (
    <div className="flex flex-col gap-1">
      <div className="relative rounded-xl" style={{
        background: autoFilled
          ? 'rgba(255,255,255,0.025)'
          : focused
          ? 'rgba(232,41,74,0.04)'
          : 'rgba(255,255,255,0.025)',
        border: error
          ? '1.5px solid rgba(255,80,80,0.6)'
          : focused
          ? `1.5px solid rgba(232,41,74,0.6)`
          : autoFilled
          ? '1.5px solid rgba(255,255,255,0.055)'
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: error
          ? '0 0 0 3px rgba(255,80,80,0.1)'
          : focused
          ? `0 0 0 3px rgba(232,41,74,0.12),0 2px 16px rgba(232,41,74,0.08)`
          : 'none',
        animation: error ? 'kz-shake 0.4s ease' : 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
      }}>
        {/* Shimmer top line on focus */}
        {focused && !error && <div className="kz-input-shimmer" />}
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: focused ? `rgba(255,160,175,0.8)` : 'rgba(255,255,255,0.28)', transition: 'color 0.2s' }}>{icon}</span>}
        {autoFilled && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.75)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        )}
        <input
          id={id} type={type} value={value}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          className="w-full bg-transparent pt-6 pb-2.5 text-[14px] rounded-xl focus:outline-none placeholder-transparent"
          style={{
            paddingLeft: icon ? 44 : 14,
            paddingRight: rightSlot || autoFilled ? 44 : 14,
            color: readOnly ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.92)',
            cursor: readOnly ? 'default' : 'text',
          }}
        />
        <label htmlFor={id} className="absolute pointer-events-none font-medium transition-all duration-200" style={{
          left: icon ? 44 : 14,
          top: lifted ? 7 : '50%',
          transform: lifted ? 'none' : 'translateY(-50%)',
          fontSize: lifted ? '10px' : '13px',
          color: lifted
            ? (error ? 'rgba(255,120,120,0.9)' : focused ? `rgba(255,160,175,0.9)` : `rgba(232,41,74,0.85)`)
            : 'rgba(255,255,255,0.3)',
          letterSpacing: lifted ? '0.05em' : 'normal',
        }}>{label}</label>
        {rightSlot && !autoFilled && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
      {error && <p className="text-[11px] pl-1 mt-0.5" style={{ color: '#ff8a8a' }}>{error}</p>}
    </div>
  )
}

// ─── Dark Select ──────────────────────────────────────────────────────────────
function DarkSelect({
  id, label, value, onChange, disabled, children, icon, error, autoFilled,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  disabled?: boolean; children?: React.ReactNode; icon?: React.ReactNode
  error?: string; autoFilled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const hasVal = value !== ''
  return (
    <div className="flex flex-col gap-1">
      <div className="relative rounded-xl" style={{
        background: disabled ? 'rgba(255,255,255,0.01)' : focused ? 'rgba(232,41,74,0.04)' : 'rgba(255,255,255,0.025)',
        border: error
          ? '1.5px solid rgba(255,80,80,0.6)'
          : focused
          ? `1.5px solid rgba(232,41,74,0.6)`
          : autoFilled
          ? '1.5px solid rgba(255,255,255,0.055)'
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: error
          ? '0 0 0 3px rgba(255,80,80,0.1)'
          : focused
          ? `0 0 0 3px rgba(232,41,74,0.12)`
          : 'none',
        opacity: disabled ? 0.38 : 1,
        animation: error ? 'kz-shake 0.4s ease' : 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease',
      }}>
        {focused && !error && <div className="kz-input-shimmer" />}
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: focused ? `rgba(255,160,175,0.8)` : 'rgba(255,255,255,0.28)', transition: 'color 0.2s' }}>{icon}</span>}
        {autoFilled && hasVal && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.75)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        )}
        <select
          id={id} value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent appearance-none focus:outline-none cursor-pointer"
          style={{
            paddingLeft: icon ? 44 : 14,
            paddingRight: 36,
            paddingTop: 22,
            paddingBottom: 10,
            fontSize: 14,
            color: hasVal ? 'rgba(255,255,255,0.92)' : 'transparent',
          }}
        >
          <option value="" style={{ background: '#0d0d18' }}>—</option>
          {children}
        </select>
        <label htmlFor={id} className="absolute pointer-events-none font-medium transition-all duration-200" style={{
          left: icon ? 44 : 14,
          top: hasVal ? 7 : '50%',
          transform: hasVal ? 'none' : 'translateY(-50%)',
          fontSize: hasVal ? '10px' : '13px',
          color: hasVal
            ? (error ? 'rgba(255,120,120,0.9)' : focused ? `rgba(255,160,175,0.9)` : `rgba(232,41,74,0.85)`)
            : 'rgba(255,255,255,0.3)',
          letterSpacing: hasVal ? '0.05em' : 'normal',
        }}>{label}</label>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: focused ? 'rgba(232,41,74,0.6)' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      {error && <p className="text-[11px] pl-1 mt-0.5" style={{ color: '#ff8a8a' }}>{error}</p>}
    </div>
  )
}

// ─── Dark TextArea ────────────────────────────────────────────────────────────
function DarkTextArea({
  id, label, value, onChange, rows = 4, rightSlot, error,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  rows?: number; rightSlot?: React.ReactNode; error?: string
}) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  return (
    <div className="flex flex-col gap-1">
      <div className="relative rounded-xl" style={{
        background: focused ? 'rgba(232,41,74,0.04)' : 'rgba(255,255,255,0.025)',
        border: error
          ? '1.5px solid rgba(255,80,80,0.6)'
          : focused
          ? `1.5px solid rgba(232,41,74,0.6)`
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: error
          ? '0 0 0 3px rgba(255,80,80,0.1)'
          : focused
          ? `0 0 0 3px rgba(232,41,74,0.12)`
          : 'none',
        animation: error ? 'kz-shake 0.4s ease' : 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
      }}>
        {focused && !error && <div className="kz-input-shimmer" />}
        <textarea
          id={id} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={rows}
          placeholder=" "
          className="w-full bg-transparent px-4 pb-3 text-[14px] rounded-xl focus:outline-none resize-none placeholder-transparent"
          style={{ paddingTop: 28, color: 'rgba(255,255,255,0.92)', paddingRight: rightSlot ? 44 : 16 }}
        />
        <label htmlFor={id} className="absolute left-4 pointer-events-none font-medium transition-all duration-200" style={{
          top: lifted ? 8 : 18,
          fontSize: lifted ? '10px' : '13px',
          color: lifted
            ? (error ? 'rgba(255,120,120,0.9)' : focused ? `rgba(255,160,175,0.9)` : `rgba(232,41,74,0.85)`)
            : 'rgba(255,255,255,0.3)',
          letterSpacing: lifted ? '0.05em' : 'normal',
        }}>{label}</label>
        {rightSlot && <div className="absolute top-2.5 right-2.5 z-10">{rightSlot}</div>}
      </div>
      {error && <p className="text-[11px] pl-1 mt-0.5" style={{ color: '#ff8a8a' }}>{error}</p>}
    </div>
  )
}

// ─── Premium Section Card ─────────────────────────────────────────────────────
function SectionCard({ num, title, children, className = '' }: { num: string; title: string; children: React.ReactNode; className?: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className={`rounded-2xl overflow-hidden kz-card ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(8,8,14,0.78)',
        border: hovered ? '1px solid rgba(232,41,74,0.22)' : '1px solid rgba(255,255,255,0.055)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(232,41,74,0.07), inset 0 1px 0 rgba(255,255,255,0.07)'
          : '0 4px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Section header */}
      <div
        className="px-6 pt-5 pb-3 flex items-center gap-3 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.045)',
          background: 'linear-gradient(90deg, rgba(232,41,74,0.045) 0%, transparent 60%)',
        }}
      >
        {/* Numbered pill badge */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(232,41,74,0.28), rgba(192,24,47,0.14))',
          border: '1px solid rgba(232,41,74,0.38)',
          borderRadius: 7,
          padding: '2px 10px',
          boxShadow: '0 0 12px rgba(232,41,74,0.18)',
          flexShrink: 0,
        }}>
          <span style={{ color: 'rgba(255,180,190,0.95)', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>{num}</span>
        </div>
        <div className="w-px h-3 flex-shrink-0" style={{ background: 'rgba(232,41,74,0.25)' }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.62)' }}>{title}</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(232,41,74,0.18), transparent)' }} />
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────
function ProgressStepper({ pct, completedCount }: { pct: number; completedCount: number }) {
  const { t } = useI18n()
  const steps = [t('submit.step.owner'), t('submit.step.location'), t('submit.step.idea'), t('submit.step.files'), t('submit.step.details')]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between relative" style={{ paddingBottom: 20 }}>
        {/* Track base */}
        <div className="absolute left-3.5 right-3.5 h-px" style={{ top: 14, background: 'rgba(255,255,255,0.07)' }} />
        {/* Track fill */}
        <div className="absolute h-px transition-all duration-700 ease-out" style={{
          left: 14, top: 14,
          width: `calc(${pct}% - 28px)`,
          background: `linear-gradient(90deg, ${RED_DARK}, ${RED}, #ff4d6d)`,
          boxShadow: '0 0 10px rgba(232,41,74,0.7)',
        }} />
        {steps.map((label, i) => {
          const done = i < completedCount
          const active = i === completedCount
          return (
            <div key={label} className="relative flex flex-col items-center z-10" style={{ gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done
                  ? `linear-gradient(135deg, #ff5577, ${RED})`
                  : active
                  ? 'rgba(232,41,74,0.14)'
                  : 'rgba(255,255,255,0.045)',
                border: done
                  ? 'none'
                  : active
                  ? `1.5px solid rgba(232,41,74,0.65)`
                  : '1px solid rgba(255,255,255,0.1)',
                boxShadow: done
                  ? `0 0 18px rgba(232,41,74,0.55), 0 2px 8px rgba(232,41,74,0.3)`
                  : active
                  ? `0 0 10px rgba(232,41,74,0.3)`
                  : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                animation: done ? 'kz-step-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
              }}>
                {done
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize: 10, fontWeight: 700, color: active ? `rgba(232,41,74,0.9)` : 'rgba(255,255,255,0.28)' }}>{i + 1}</span>
                }
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: '0.05em',
                color: done ? 'rgba(255,255,255,0.45)' : active ? `rgba(232,41,74,0.8)` : 'rgba(255,255,255,0.18)',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
                position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
              }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mesh Background ──────────────────────────────────────────────────────────
function MeshBackground() {
  return (
    <>
      {/* Deep void orbs */}
      <div className="fixed pointer-events-none" style={{
        top: '-15%', left: '-10%', width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,41,74,0.13) 0%, transparent 70%)',
        filter: 'blur(100px)',
        animation: 'kz-breathe 8s ease-in-out infinite, kz-gradient-shift 20s linear infinite',
        zIndex: 0,
      }} />
      <div className="fixed pointer-events-none" style={{
        top: '30%', right: '-15%', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,40,215,0.07) 0%, transparent 70%)',
        filter: 'blur(120px)',
        animation: 'kz-breathe 12s 3s ease-in-out infinite reverse',
        zIndex: 0,
      }} />
      <div className="fixed pointer-events-none" style={{
        bottom: '-10%', left: '25%', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,24,47,0.09) 0%, transparent 70%)',
        filter: 'blur(90px)',
        animation: 'kz-breathe 10s 1.5s ease-in-out infinite',
        zIndex: 0,
      }} />
      {/* Subtle dot grid — fades at edges via radial mask */}
      <div className="fixed inset-0 pointer-events-none" style={{
        zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        opacity: 0.4,
      }} />
    </>
  )
}

// ─── File image preview lightbox ──────────────────────────────────────────────
function ImageLightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative max-w-3xl w-full kz-up-1">
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(10,10,16,0.9)',
          border: '1px solid rgba(232,41,74,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <span className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{name}</span>
            <button onClick={onClose} className="transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.color = RED)}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="p-3 flex items-center justify-center" style={{ maxHeight: '72vh' }}>
            <img src={src} alt={name} className="max-w-full max-h-[68vh] object-contain rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
type UploadedFile = { id: string; name: string; previewUrl: string | null; mimeType: string }

function UploadZone({
  onFile, disabled, uploading, files, onRemove,
}: {
  onFile: (f: File) => void; disabled?: boolean; uploading?: boolean
  files: UploadedFile[]; onRemove: (id: string) => void
}) {
  const { t } = useI18n()
  const [dragging, setDragging]     = useState(false)
  const [lightbox, setLightbox]     = useState<{ src: string; name: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const isImage = (mime: string) => mime.startsWith('image/')

  return (
    <>
      {lightbox && <ImageLightbox src={lightbox.src} name={lightbox.name} onClose={() => setLightbox(null)} />}
      <div>
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="rounded-xl flex flex-col items-center justify-center gap-3 py-9 transition-all duration-250"
          style={{
            border: dragging
              ? `1.5px solid rgba(232,41,74,0.75)`
              : `1.5px dashed rgba(255,255,255,0.1)`,
            background: dragging ? 'rgba(232,41,74,0.07)' : 'rgba(255,255,255,0.015)',
            boxShadow: dragging ? '0 0 24px rgba(232,41,74,0.14), inset 0 0 24px rgba(232,41,74,0.04)' : 'none',
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{
            background: 'rgba(232,41,74,0.1)',
            border: '1px solid rgba(232,41,74,0.22)',
            boxShadow: '0 0 20px rgba(232,41,74,0.12)',
          }}>
            {uploading
              ? <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="rgba(232,41,74,0.8)" strokeWidth="3"/><path className="opacity-75" fill={RED} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            }
          </div>
          <div className="text-center">
            <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {uploading ? t('submit.hint.uploading') : t('submit.hint.dropFiles')}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.22)' }}>{t('submit.hint.fileTypes')}</p>
          </div>
          <input ref={inputRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); if (inputRef.current) inputRef.current.value = '' }}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200" style={{
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.065)',
              }}>
                {f.previewUrl && isImage(f.mimeType)
                  ? <img src={f.previewUrl} alt={f.name}
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0 cursor-pointer transition-all duration-200"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)', outline: '1px solid rgba(255,255,255,0.08)' }}
                      onClick={() => setLightbox({ src: f.previewUrl!, name: f.name })}
                      onMouseEnter={e => (e.currentTarget.style.outline = '1px solid rgba(232,41,74,0.5)')}
                      onMouseLeave={e => (e.currentTarget.style.outline = '1px solid rgba(255,255,255,0.08)')} />
                  : <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232,41,74,0.12)', border: '1px solid rgba(232,41,74,0.18)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                }
                <span className="text-[13px] flex-1 truncate" style={{ color: 'rgba(255,255,255,0.68)' }}>{f.name}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {f.previewUrl && (
                    <button type="button"
                      title={isImage(f.mimeType) ? 'Preview' : 'Open'}
                      onClick={() => isImage(f.mimeType) ? setLightbox({ src: f.previewUrl!, name: f.name }) : window.open(f.previewUrl!, '_blank')}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                      style={{ background: 'rgba(255,255,255,0.045)', color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = RED; el.style.background = 'rgba(232,41,74,0.12)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(255,255,255,0.35)'; el.style.background = 'rgba(255,255,255,0.045)' }}>
                      {isImage(f.mimeType)
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      }
                    </button>
                  )}
                  <button type="button" onClick={() => onRemove(f.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
                    style={{ background: 'rgba(255,255,255,0.045)', color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#ff6b6b'; el.style.background = 'rgba(255,80,80,0.12)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(255,255,255,0.35)'; el.style.background = 'rgba(255,255,255,0.045)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Track Idea Panel ─────────────────────────────────────────────────────────
function TrackIdeaPanel() {
  const { t } = useI18n()
  const [trackInput, setTrackInput]   = useState('')
  const [trackResult, setTrackResult] = useState<PublicIdeaTrackResult | null>(null)
  const [trackError, setTrackError]   = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  const STAGE_LABELS: Record<string, string> = {
    ZONE_REVIEW:      'Zone Leader Review',
    HOD_REVIEW:       'HOD Review',
    SAFETY_REVIEW:    'Plant Safety Review',
    QMS_REVIEW:       'Plant Quality Review',
    IDEA_APPROVED:    'Approved — Awaiting Implementation',
    IDEA_REJECTED:    'Rejected',
    IMPL_ZL_REVIEW:   'Implementation — Zone Leader',
    IMPL_HOD_REVIEW:  'Implementation — HOD',
    SME_REVIEW:       'SME Review',
    SCI_TECH_UPLOAD:  'Sci-Tech Documentation',
    KAIZEN_APPROVED:  'Fully Approved',
    KAIZEN_REJECTED:  'Implementation Rejected',
  }

  const STATUS_COLOR: Record<string, string> = {
    SUBMITTED: 'rgba(251,191,36,0.9)',
    APPROVED:  'rgba(34,197,94,0.9)',
    REJECTED:  '#ff8a8a',
    RETURNED:  'rgba(251,191,36,0.9)',
    DRAFT:     'rgba(255,255,255,0.4)',
  }

  const handleTrack = async () => {
    const id = trackInput.trim().toUpperCase()
    if (!id) return
    setLoading(true); setTrackError(null); setTrackResult(null)
    try {
      const r = await trackPublicIdea(id)
      setTrackResult(r)
    } catch (err) {
      setTrackError(err instanceof Error ? err.message : 'Not found')
    } finally { setLoading(false) }
  }

  return (
    <SectionCard num="06" title={t('submit.sec.track')}>
      <p className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {t('submit.hint.trackDesc')}
      </p>
      <div className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <DarkInput
            id="trackId" label={t('submit.field.trackId')}
            value={trackInput} onChange={setTrackInput}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleTrack() } }}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
          />
        </div>
        <button type="button" onClick={() => void handleTrack()} disabled={loading || !trackInput.trim()}
          className="rounded-xl px-5 text-[13px] font-semibold transition-all duration-200 disabled:opacity-35 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg,${RED},${RED_DARK})`,
            color: 'white',
            boxShadow: '0 4px 16px rgba(232,41,74,0.35)',
            height: 52,
            border: 'none',
          }}>
          {loading ? '…' : t('submit.btn.track')}
        </button>
      </div>

      {trackError && (
        <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.18)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff8a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="text-[13px]" style={{ color: '#ff8a8a' }}>{trackError}</span>
        </div>
      )}

      {trackResult && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.065)' }}>
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{
            borderColor: 'rgba(255,255,255,0.05)',
            background: 'linear-gradient(90deg, rgba(232,41,74,0.04), transparent)',
          }}>
            <span className="font-mono font-bold text-[14px]" style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '0.03em' }}>{trackResult.registration_id}</span>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{
              background: `${STATUS_COLOR[trackResult.status] ?? 'rgba(255,255,255,0.4)'}18`,
              color: STATUS_COLOR[trackResult.status] ?? 'rgba(255,255,255,0.4)',
              border: `1px solid ${STATUS_COLOR[trackResult.status] ?? 'rgba(255,255,255,0.1)'}35`,
              letterSpacing: '0.08em',
            }}>{trackResult.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-px" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {[
              { label: t('submit.status.title'),        value: trackResult.title },
              { label: t('submit.status.plant'),        value: trackResult.plant_name ?? '—' },
              { label: t('submit.status.currentStage'), value: trackResult.current_stage ? (STAGE_LABELS[trackResult.current_stage] ?? trackResult.current_stage) : '—' },
              { label: t('submit.status.submitted'),    value: trackResult.submitted_at ? new Date(trackResult.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-3.5" style={{ background: 'rgba(8,8,14,0.6)' }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 700 }}>{label}</div>
                <div className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ result, onNew }: { result: PublicSubmitResult; onNew: () => void }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(result.registration_id); setCopied(true); setTimeout(() => setCopied(false), 2500) }
  const confettiColors = ['#e8294a', '#ff4d6d', '#ffffff', '#ffb3c1', '#c0182f', '#ff8fa3']

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#060608' }}>
      <style>{CSS}</style>
      <MeshBackground />

      {/* Confetti */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="fixed pointer-events-none rounded-sm" style={{
          left: `${5 + i * 5.2}%`, top: '55%',
          width: i % 3 === 0 ? 8 : 5, height: i % 3 === 0 ? 8 : 5,
          background: confettiColors[i % confettiColors.length],
          animation: `kz-confetti ${0.7 + (i % 5) * 0.25}s ${i * 0.06}s ease-out both`,
        }} />
      ))}

      <div className="w-full max-w-md kz-up-1 relative z-10">
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(8,8,14,0.82)',
          border: '1px solid rgba(232,41,74,0.2)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(232,41,74,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}>
          <div className="p-9 text-center">
            {/* Success icon */}
            <div className="w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-6" style={{
              width: 72, height: 72,
              background: 'rgba(34,197,94,0.12)',
              border: '1.5px solid rgba(34,197,94,0.35)',
              boxShadow: '0 0 32px rgba(34,197,94,0.22)',
            }}>
              <svg className="w-9 h-9" fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>

            <h2 className="text-[1.75rem] font-extrabold mb-2 tracking-tight" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(255,220,225,0.88) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{t('submit.success.title')}</h2>
            <p className="text-[13px] mb-7" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {t('submit.success.subtitle')}
            </p>

            {/* Registration ID — animated border */}
            <div className="rounded-xl p-5 mb-5 relative overflow-hidden" style={{
              background: 'rgba(232,41,74,0.07)',
              border: '1px solid rgba(232,41,74,0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
              <div className="kz-input-shimmer" />
              <div className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: 'rgba(232,41,74,0.75)' }}>{t('submit.success.regId')}</div>
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <span className="text-[1.25rem] font-mono font-bold tracking-wider" style={{
                  color: 'rgba(255,255,255,0.95)',
                  textShadow: `0 0 24px rgba(232,41,74,0.5)`,
                }}>{result.registration_id}</span>
                <button onClick={() => void copy()} className="transition-all duration-200" style={{ color: copied ? 'rgba(34,197,94,0.85)' : 'rgba(255,255,255,0.3)' }}>
                  {copied
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
              </div>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>{t('submit.success.saveId')}</p>
            </div>

            {/* Status chips */}
            <div className="grid grid-cols-2 gap-2.5 mb-7 text-left">
              {[
                { label: t('submit.status.currentStage'), value: result.current_stage },
                { label: t('submit.status.status'), value: result.status },
                ...(result.assigned_to ? [{ label: t('submit.status.assignedTo'), value: result.assigned_to.full_name }] : []),
              ].map(item => (
                <div key={item.label}
                  className={`rounded-xl p-3.5 ${!result.assigned_to || item.label !== t('submit.status.assignedTo') ? '' : 'col-span-2'}`}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.055)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  <div className="text-[9px] uppercase tracking-[0.1em] mb-1 font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  <div className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.82)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <Btn3D onClick={onNew} className="w-full py-3.5 text-[14px]">{t('submit.btn.submitAnother')}</Btn3D>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader() {
  const navigate = useNavigate()
  const { lang, setLang, t } = useI18n()
  return (
    <header className="sticky top-0 z-50" style={{ background: 'rgba(6,6,8,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* Logo badge — bigger, more glow */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(140deg, #ff5577, ${RED}, ${RED_DARK})`,
            boxShadow: `0 0 20px rgba(232,41,74,0.5), 0 4px 16px rgba(232,41,74,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="text-white font-black text-[15px]" style={{ letterSpacing: '-0.02em' }}>K</span>
          </div>
          <div>
            <div className="text-[14px] font-bold" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,200,210,0.85))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}>{t('submit.header.platform')}</div>
            <div className="text-[9.5px] uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('submit.header.tagline')}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language pill */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.28)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </span>
            <select value={lang} onChange={e => setLang(e.target.value as typeof lang)}
              className="appearance-none rounded-full pl-8 pr-6 py-2 text-[12px] font-medium focus:outline-none cursor-pointer transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.055)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.65)',
              }}>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.native}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.28)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>

          <Btn3D variant="outline" type="button" onClick={() => navigate('/login')} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 10 }}>
            {t('submit.header.staffLogin')}
          </Btn3D>
        </div>
      </div>
      {/* Gradient separator line */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(232,41,74,0.4) 30%, rgba(232,41,74,0.4) 70%, transparent 100%)' }} />
    </header>
  )
}

// ─── Floating micro particles ─────────────────────────────────────────────────
const PARTICLES = [
  {x:6,b:18,s:2.5,dur:9,del:0},{x:16,b:55,s:2,dur:12,del:1.5},{x:26,b:30,s:3,dur:10,del:3},
  {x:36,b:72,s:2,dur:14,del:0.8},{x:46,b:20,s:3.5,dur:8,del:2.5},{x:56,b:80,s:2,dur:11,del:4},
  {x:66,b:45,s:2.5,dur:13,del:1},{x:76,b:65,s:3,dur:9,del:3.5},{x:86,b:35,s:2,dur:10,del:0.3},
  {x:94,b:60,s:2,dur:12,del:2},
]

// ─── Field error type ─────────────────────────────────────────────────────────
type FieldErrors = Partial<Record<string, string>>

// ─── Main page ────────────────────────────────────────────────────────────────
export function PublicIdeaSubmissionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()

  // Employee
  const [employeeIdInput, setEmployeeIdInput] = useState(searchParams.get('emp') ?? '')
  const [employeeId, setEmployeeId]           = useState(searchParams.get('emp') ?? '')
  const [profile, setProfile]                 = useState<PublicEmployeeProfile | null>(null)
  const [lookupLoading, setLookupLoading]     = useState(false)
  const [lookupError, setLookupError]         = useState<string | null>(null)

  // Operational
  const [plantId, setPlantId]               = useState('')
  const [zoneId, setZoneId]                 = useState('')
  const [zoneAutoFilled, setZoneAutoFilled] = useState(false)
  const [departmentId, setDepartmentId]     = useState('')
  const [functionId, setFunctionId]         = useState('')
  const [hallId, setHallId]                 = useState('')
  const [locationId, setLocationId]         = useState('')
  const [valueStream, setValueStream]       = useState('')
  const [categoryId, setCategoryId]         = useState('')
  const [subCategoryId, setSubCategoryId]   = useState('')

  // Idea content
  const [title, setTitle]                       = useState('')
  const [problemStatement, setProblemStatement] = useState('')
  const [description, setDescription]           = useState('')
  const [remarks, setRemarks]                   = useState('')
  const [contactEmail, setContactEmail]         = useState('')

  // Files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError]     = useState<string | null>(null)

  // Form state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult]           = useState<PublicSubmitResult | null>(null)

  // Master data
  const { data: master } = useQuery({
    queryKey: ['public-master-data'],
    queryFn: getPublicMasterData,
    staleTime: 10 * 60 * 1000,
  })

  // Cascading filters
  const filteredZones        = useMemo(() => master?.zones.filter(z => z.plant_id === plantId) ?? [], [master, plantId])
  const filteredDepts        = useMemo(() => master?.departments.filter(d => d.zone_id === zoneId) ?? [], [master, zoneId])
  const filteredFunctions    = useMemo(() => master?.functions.filter(f => f.department_id === departmentId) ?? [], [master, departmentId])
  const filteredHalls        = useMemo(() => master?.halls.filter(h => h.function_id === functionId) ?? [], [master, functionId])
  const filteredLocations    = useMemo(() => master?.locations.filter(l => l.hall_id === hallId) ?? [], [master, hallId])
  const filteredSubCats      = useMemo(() => master?.sub_categories.filter(s => s.category_id === categoryId) ?? [], [master, categoryId])

  // Value streams filtered by plant
  const filteredValueStreams = useMemo(() => {
    if (!master?.value_streams) return []
    if (!plantId) return master.value_streams
    return master.value_streams.filter(vs => vs.plant_id === null || vs.plant_id === plantId)
  }, [master, plantId])

  // Reset value stream when plant changes and selection is no longer valid
  useEffect(() => {
    if (valueStream && filteredValueStreams.length > 0) {
      const stillValid = filteredValueStreams.some(vs => vs.name === valueStream)
      if (!stillValid) setValueStream('')
    }
  }, [filteredValueStreams, valueStream])

  // Progress — integer 0-5 for stepper
  const completedCount = useMemo(() => {
    let done = 0
    if (profile) done++
    if (plantId && zoneId && departmentId) done++
    if (categoryId) done++
    if (problemStatement.length >= 10 && description.length >= 10) done++
    if (uploadedFiles.length > 0 || remarks) done++
    return done
  }, [profile, plantId, zoneId, departmentId, categoryId, problemStatement, description, uploadedFiles, remarks])
  const progressPct = completedCount * 20

  // Employee lookup
  const handleLookup = async (id = employeeIdInput) => {
    const trimmed = id.trim(); if (!trimmed) return
    setLookupLoading(true); setLookupError(null); setProfile(null)
    try {
      const emp = await lookupEmployee(trimmed)
      setProfile(emp); setEmployeeId(trimmed)
      if (emp.home_plant)      { setPlantId(emp.home_plant.id) }
      if (emp.home_zone)       { setZoneId(emp.home_zone.id); setZoneAutoFilled(true) }
      else                     { setZoneAutoFilled(false) }
      if (emp.home_department) setDepartmentId(emp.home_department.id)
      if (emp.home_function)   setFunctionId(emp.home_function.id)
      if (emp.home_hall)       setHallId(emp.home_hall.id)
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next['employee']; delete next['plant']; delete next['zone']
        delete next['department']; delete next['function']; delete next['hall']
        return next
      })
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Employee not found')
    } finally { setLookupLoading(false) }
  }

  // File upload with blob URL preview
  const handleFile = useCallback(async (file: File) => {
    if (!employeeId) return
    if (uploadedFiles.length >= 5) { setUploadError('Maximum 5 files allowed'); return }
    setUploadingFile(true); setUploadError(null)
    const previewUrl = URL.createObjectURL(file)
    try {
      const res = await uploadPublicFile(file, employeeId)
      setUploadedFiles(prev => [...prev, { id: res.file_id, name: res.file_name, previewUrl, mimeType: file.type }])
    } catch (err) {
      URL.revokeObjectURL(previewUrl)
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally { setUploadingFile(false) }
  }, [employeeId, uploadedFiles.length])

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl)
      return prev.filter(f => f.id !== id)
    })
  }, [])

  // Per-field validation
  const validate = (): FieldErrors => {
    const errs: FieldErrors = {}
    if (!profile)                     errs['employee']         = 'Please look up a valid Employee ID first'
    if (!title.trim())                errs['title']            = 'Idea title is required'
    if (title.trim().length < 3)      errs['title']            = 'Title must be at least 3 characters'
    if (!plantId)                     errs['plant']            = 'Plant is required'
    if (!zoneId)                      errs['zone']             = 'Zone is required'
    if (!departmentId)                errs['department']       = 'Department is required'
    if (!functionId)                  errs['function']         = 'Function is required'
    if (!hallId)                      errs['hall']             = 'Hall is required'
    if (!locationId)                  errs['location']         = 'Location is required'
    if (!valueStream)                 errs['valueStream']      = 'Value Stream is required'
    if (!categoryId)                  errs['category']         = 'Category is required'
    if (problemStatement.length < 10) errs['problemStatement'] = 'Problem Statement must be at least 10 characters'
    if (description.length < 10)      errs['description']      = 'Idea Description must be at least 10 characters'
    return errs
  }

  // Submit
  const submitMutation = useMutation({
    mutationFn: submitPublicIdea,
    onSuccess: data => setResult(data),
    onError: err => setSubmitError(err instanceof Error ? err.message : 'Submission failed'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitError(null)
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      const firstKey = Object.keys(errs)[0]
      document.getElementById(firstKey ?? '')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setFieldErrors({})
    submitMutation.mutate({
      employee_id:       employeeId,
      title:             title.trim(),
      plant_id:          plantId,
      zone_id:           zoneId,
      department_id:     departmentId,
      category_id:       categoryId,
      problem_statement: problemStatement,
      description,
      function_id:         functionId,
      hall_id:             hallId,
      location_id:         locationId,
      value_stream:        valueStream,
      ...(subCategoryId  ? { sub_category_id: subCategoryId } : {}),
      ...(remarks        ? { remarks }                        : {}),
      ...(contactEmail   ? { contact_email: contactEmail }    : {}),
      is_anonymous: false,
      ...(uploadedFiles.length ? { attachment_file_ids: uploadedFiles.map(f => f.id) } : {}),
    })
  }

  // Full reset
  const handleReset = () => {
    uploadedFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl) })
    setResult(null); setProfile(null); setEmployeeIdInput(''); setEmployeeId('')
    setPlantId(''); setZoneId(''); setZoneAutoFilled(false)
    setDepartmentId(''); setFunctionId(''); setHallId(''); setLocationId(''); setValueStream('')
    setCategoryId(''); setSubCategoryId('')
    setTitle(''); setProblemStatement(''); setDescription(''); setRemarks(''); setContactEmail('')
    setUploadedFiles([])
    setLookupError(null); setSubmitError(null); setFieldErrors({})
  }

  if (result) return <SuccessScreen result={result} onNew={handleReset} />

  return (
    <>
      <style>{CSS}</style>
      <div className="min-h-screen flex flex-col" style={{ background: '#060608' }}>

        {/* Mesh background layer */}
        <MeshBackground />

        {/* Micro floating particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} className="fixed pointer-events-none rounded-full" style={{
            left: `${p.x}%`, bottom: `${p.b}%`,
            width: p.s, height: p.s,
            background: `rgba(232,41,74,${0.18 + (i % 4) * 0.08})`,
            boxShadow: `0 0 ${p.s * 4}px rgba(232,41,74,0.3)`,
            animation: `kz-drift ${p.dur}s ${p.del}s ease-in-out infinite`,
            zIndex: 1,
          }} />
        ))}

        {/* Giant K watermark */}
        <div className="fixed top-0 right-0 pointer-events-none select-none" style={{
          fontSize: 420, fontWeight: 900,
          background: 'linear-gradient(135deg, rgba(232,41,74,0.03), rgba(192,24,47,0.015))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1, zIndex: 0,
        }}>K</div>

        <PageHeader />

        <div className="relative flex-1 px-4 py-10 max-w-3xl mx-auto w-full" style={{ zIndex: 2 }}>

          {/* ── Page title ───────────────────────────────────────────────── */}
          <div className="mb-10 kz-up-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-[2.4rem] font-extrabold leading-tight tracking-tight" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(255,220,225,0.88) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {t('submit.pageTitle')}
              </h1>
            </div>
            <p className="text-[13.5px] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              <span style={{ color: 'rgba(232,41,74,0.6)', fontSize: 11 }}>→</span>
              {t('submit.pageSubtitle')}
            </p>
            {/* Accent bar */}
            <div className="mt-4" style={{
              height: 4, width: 52, borderRadius: 4,
              background: `linear-gradient(90deg, ${RED_DARK}, ${RED}, #ff5577)`,
              boxShadow: `0 0 14px rgba(232,41,74,0.65)`,
            }} />
            {/* Progress stepper */}
            <div className="mt-8">
              <ProgressStepper pct={progressPct} completedCount={completedCount} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── 01 Idea Owner Details ────────────────────────────────── */}
            <div className="kz-up-2">
              <SectionCard num="01" title={t('submit.sec.ownerDetails')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <DarkInput
                          id="employee" label={`${t('submit.field.employeeId')} *`}
                          value={employeeIdInput}
                          onChange={v => { setEmployeeIdInput(v); if (fieldErrors['employee']) setFieldErrors(p => ({ ...p, employee: undefined })) }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleLookup() } }}
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                          rightSlot={<MicButton value={employeeIdInput} onChange={setEmployeeIdInput} variant="dark" />}
                          error={lookupError ?? fieldErrors['employee']}
                        />
                      </div>
                      <button type="button" onClick={() => void handleLookup()} disabled={lookupLoading || !employeeIdInput.trim()}
                        className="rounded-xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-35 flex-shrink-0 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg,#ff5577,${RED},${RED_DARK})`,
                          color: 'white',
                          boxShadow: '0 4px 16px rgba(232,41,74,0.4)',
                          height: 52, width: 72, border: 'none',
                        }}>
                        {lookupLoading
                          ? <svg className="animate-spin w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          : t('submit.btn.search')
                        }
                      </button>
                    </div>
                  </div>
                  <DarkInput id="empName" label={t('submit.field.employeeName')} value={profile?.full_name ?? ''} readOnly autoFilled={!!profile} />
                  <DarkInput id="empZone" label={t('submit.field.zoneOfOwner')} value={profile?.home_zone?.name ?? ''} readOnly autoFilled={!!profile} />
                  <DarkInput id="empHall" label={t('submit.field.hallOfOwner')} value={profile?.home_hall?.name ?? ''} readOnly autoFilled={!!profile} />
                </div>
              </SectionCard>
            </div>

            {/* ── 02 Operational Details ───────────────────────────────── */}
            <div className="kz-up-3">
              <SectionCard num="02" title={t('submit.sec.operational')}>
                {zoneAutoFilled && (
                  <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5" style={{
                    background: 'rgba(99,102,241,0.07)',
                    borderLeft: '3px solid rgba(99,102,241,0.55)',
                    borderTop: '1px solid rgba(99,102,241,0.18)',
                    borderRight: '1px solid rgba(99,102,241,0.18)',
                    borderBottom: '1px solid rgba(99,102,241,0.18)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="text-[12px]" style={{ color: 'rgba(165,180,252,0.85)' }}>
                      {t('submit.hint.prefilled')}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DarkSelect id="plant" label={`${t('submit.field.plant')} *`} value={plantId} error={fieldErrors['plant']}
                    onChange={v => { setPlantId(v); setZoneId(''); setZoneAutoFilled(false); setDepartmentId(''); setFunctionId(''); setHallId(''); setLocationId(''); setValueStream(''); setFieldErrors(p => ({ ...p, plant: undefined })) }}
                    icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}>
                    {master?.plants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                  </DarkSelect>

                  <DarkSelect id="zone" label={`${t('submit.field.zone')} *`} value={zoneId} error={fieldErrors['zone']} autoFilled={zoneAutoFilled}
                    onChange={v => { setZoneId(v); setZoneAutoFilled(false); setDepartmentId(''); setFunctionId(''); setHallId(''); setLocationId(''); setFieldErrors(p => ({ ...p, zone: undefined })) }}
                    disabled={!plantId}>
                    {filteredZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </DarkSelect>

                  <DarkSelect id="department" label={`${t('submit.field.department')} *`} value={departmentId} error={fieldErrors['department']}
                    onChange={v => { setDepartmentId(v); setFunctionId(''); setHallId(''); setLocationId(''); setFieldErrors(p => ({ ...p, department: undefined })) }}
                    disabled={!zoneId}>
                    {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </DarkSelect>

                  <DarkSelect id="function" label={`${t('submit.field.function')} *`} value={functionId} error={fieldErrors['function']}
                    onChange={v => { setFunctionId(v); setHallId(''); setLocationId(''); setFieldErrors(p => ({ ...p, function: undefined })) }}
                    disabled={!departmentId}>
                    {filteredFunctions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </DarkSelect>

                  <DarkSelect id="hall" label={`${t('submit.field.hall')} *`} value={hallId} error={fieldErrors['hall']}
                    onChange={v => { setHallId(v); setLocationId(''); setFieldErrors(p => ({ ...p, hall: undefined })) }}
                    disabled={!functionId}>
                    {filteredHalls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </DarkSelect>

                  <DarkSelect id="location" label={`${t('submit.field.location')} *`} value={locationId} error={fieldErrors['location']}
                    onChange={v => { setLocationId(v); setFieldErrors(p => ({ ...p, location: undefined })) }}
                    disabled={!hallId}>
                    {filteredLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </DarkSelect>

                  <DarkSelect id="valueStream" label={`${t('submit.field.valueStream')} *`} value={valueStream} error={fieldErrors['valueStream']}
                    onChange={v => { setValueStream(v); setFieldErrors(p => ({ ...p, valueStream: undefined })) }}
                    icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}>
                    {filteredValueStreams.map(vs => <option key={vs.id} value={vs.name}>{vs.name}</option>)}
                  </DarkSelect>

                  <DarkSelect id="category" label={`${t('submit.field.category')} *`} value={categoryId} error={fieldErrors['category']}
                    onChange={v => { setCategoryId(v); setSubCategoryId(''); setFieldErrors(p => ({ ...p, category: undefined })) }}>
                    {master?.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </DarkSelect>

                  <DarkSelect id="subcat" label={t('submit.field.subCategory')} value={subCategoryId} onChange={setSubCategoryId} disabled={!categoryId}>
                    {filteredSubCats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </DarkSelect>
                </div>
              </SectionCard>
            </div>

            {/* ── 03 Idea Details ──────────────────────────────────────── */}
            <div className="kz-up-3">
              <SectionCard num="03" title={t('submit.sec.ideaDetails')}>
                <div className="flex flex-col gap-4">
                  <DarkInput
                    id="title" label={`${t('submit.field.ideaTitle')} *`}
                    value={title}
                    onChange={v => { setTitle(v); if (fieldErrors['title']) setFieldErrors(p => ({ ...p, title: undefined })) }}
                    error={fieldErrors['title']}
                    icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DarkTextArea id="problemStatement" label={`${t('submit.field.problemStatement')} *`}
                      value={problemStatement}
                      onChange={v => { setProblemStatement(v); if (fieldErrors['problemStatement']) setFieldErrors(p => ({ ...p, problemStatement: undefined })) }}
                      rows={5} error={fieldErrors['problemStatement']}
                      rightSlot={<MicButton value={problemStatement} onChange={setProblemStatement} variant="dark" />} />
                    <DarkTextArea id="description" label={`${t('submit.field.ideaDescription')} *`}
                      value={description}
                      onChange={v => { setDescription(v); if (fieldErrors['description']) setFieldErrors(p => ({ ...p, description: undefined })) }}
                      rows={5} error={fieldErrors['description']}
                      rightSlot={<MicButton value={description} onChange={setDescription} variant="dark" />} />
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* ── 04 Supporting Document ───────────────────────────────── */}
            <div className="kz-up-4">
              <SectionCard num="04" title={t('submit.sec.documents')}>
                {!profile && (
                  <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-4" style={{
                    background: 'rgba(251,191,36,0.07)',
                    border: '1px solid rgba(251,191,36,0.18)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-[12px]" style={{ color: 'rgba(251,191,36,0.65)' }}>{t('submit.hint.lookupFirst')}</span>
                  </div>
                )}
                {uploadError && <p className="text-[12px] mb-3" style={{ color: '#ff8a8a' }}>{uploadError}</p>}
                <UploadZone
                  onFile={f => void handleFile(f)}
                  disabled={!profile || uploadedFiles.length >= 5}
                  uploading={uploadingFile}
                  files={uploadedFiles}
                  onRemove={handleRemoveFile}
                />
              </SectionCard>
            </div>

            {/* ── 05 Additional Details ────────────────────────────────── */}
            <div className="kz-up-5">
              <SectionCard num="05" title={t('submit.sec.additional')}>
                <div className="flex flex-col gap-4">
                  <DarkInput
                    id="contactEmail" label={t('submit.field.contactEmail')}
                    type="email" value={contactEmail} onChange={setContactEmail}
                    icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                  />
                  <DarkTextArea id="remarks" label={t('submit.field.remarks')} value={remarks} onChange={setRemarks} rows={3}
                    rightSlot={<MicButton value={remarks} onChange={setRemarks} variant="dark" />} />
                </div>
              </SectionCard>
            </div>

            {/* Server-side error banner */}
            {submitError && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3.5" style={{
                background: 'rgba(255,80,80,0.07)',
                border: '1px solid rgba(255,80,80,0.18)',
                color: '#ff8a8a',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span className="text-[13px]">{submitError}</span>
              </div>
            )}

            {/* ── Cinematic Submit Button ──────────────────────────────── */}
            <div className="pt-2 pb-6 space-y-3">
              <button
                type="submit"
                disabled={submitMutation.isPending || !profile}
                className="relative w-full overflow-hidden group"
                style={{
                  height: 60,
                  borderRadius: 16,
                  border: 'none',
                  background: (!profile || submitMutation.isPending)
                    ? 'rgba(255,255,255,0.055)'
                    : `linear-gradient(135deg, #ff6b8a 0%, ${RED} 45%, ${RED_DARK} 100%)`,
                  boxShadow: (!profile || submitMutation.isPending)
                    ? 'none'
                    : '0 8px 32px rgba(232,41,74,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  animation: (profile && !submitMutation.isPending) ? 'kz-btn-pulse 3s ease-in-out infinite' : 'none',
                  cursor: (!profile || submitMutation.isPending) ? 'not-allowed' : 'pointer',
                  fontSize: 16, fontWeight: 700, letterSpacing: '0.03em',
                  color: !profile ? 'rgba(255,255,255,0.28)' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  transition: 'box-shadow 0.3s ease',
                }}
              >
                {/* Shimmer sweep on hover */}
                {profile && !submitMutation.isPending && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.13) 50%, transparent 80%)',
                      backgroundSize: '200% 100%',
                      animation: 'kz-shimmer 1.4s linear infinite',
                    }}
                  />
                )}
                {submitMutation.isPending ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    <span>{t('submit.hint.submitting')}</span>
                  </>
                ) : !profile ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>{t('submit.btn.enterEmpFirst')}</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    <span>{t('submit.btn.submit')}</span>
                    <svg
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    ><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>
              {/* Ghost cancel */}
              <div className="flex justify-center">
                <button type="button" onClick={() => navigate('/login')}
                  className="text-[12px] transition-colors duration-200 bg-transparent border-none cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
                  {t('submit.btn.cancel')}
                </button>
              </div>
            </div>
          </form>

          {/* ── 06 Track submitted idea ──────────────────────────────── */}
          <div className="kz-up-6 pb-12">
            <TrackIdeaPanel />
          </div>

        </div>
      </div>
    </>
  )
}
