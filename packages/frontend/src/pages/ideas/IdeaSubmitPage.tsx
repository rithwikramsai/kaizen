import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import { createIdea, type CreateIdeaResult } from '../../api/ideas.js'
import { getMyProfile } from '../../api/auth.js'
import { FileUpload } from '../../components/FileUpload.js'
import { PageTransition } from '../../components/PageTransition.js'
import {
  getZonesByPlant,
  getDeptsByZone,
  getFunctionsByDept,
  getHallsByFunction,
  getLocationsByHall,
  getCategories,
  getSubCategoriesByCategory,
  getTags,
  getValueStreams,
} from '../../api/master.js'

// ─── Theme ────────────────────────────────────────────────────────────────────
const RED = '#e8294a'
const RED_DARK = '#c0182f'

// ─── Animations ───────────────────────────────────────────────────────────────
const CSS = `
@keyframes kz-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes kz-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes kz-btn-pulse{0%,100%{box-shadow:0 8px 32px rgba(232,41,74,0.35),inset 0 1px 0 rgba(255,255,255,0.2)}50%{box-shadow:0 12px 48px rgba(232,41,74,0.55),inset 0 1px 0 rgba(255,255,255,0.2)}}
@keyframes kz-ready-ring{0%,100%{box-shadow:0 0 0 0 rgba(232,41,74,0),0 10px 40px rgba(232,41,74,0.5),inset 0 1px 0 rgba(255,255,255,0.25)}50%{box-shadow:0 0 0 4px rgba(232,41,74,0.4),0 16px 56px rgba(232,41,74,0.7),inset 0 1px 0 rgba(255,255,255,0.25)}}
@keyframes kz-shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
@keyframes kz-step-pop{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes kz-badge-pop{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}
@keyframes kz-breathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
@keyframes kz-gradient-shift{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(30deg)}}
@keyframes kz-section-shimmer{0%{left:-100%;opacity:0}20%{opacity:1}100%{left:150%;opacity:0}}
@keyframes kz-title-arrow{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
@keyframes kz-accent-pulse{0%,100%{box-shadow:0 0 10px rgba(232,41,74,0.5),0 0 20px rgba(232,41,74,0.2)}50%{box-shadow:0 0 18px rgba(232,41,74,0.8),0 0 36px rgba(232,41,74,0.35)}}
@keyframes kz-tag-pop{0%{transform:scale(1)}40%{transform:scale(1.14)}100%{transform:scale(1)}}
@keyframes kz-label-appear{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@keyframes kz-chip-in{from{opacity:0;transform:scale(0.85) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes kz-bar-grow{from{width:0}to{width:100%}}
@keyframes kz-drift{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:1}50%{transform:translateY(-55px) translateX(7px);opacity:0.7}90%{opacity:0.3}100%{transform:translateY(-120px) translateX(-5px);opacity:0}}
@keyframes kz-fadein{from{opacity:0}to{opacity:1}}
@keyframes ring-complete{0%{transform:rotate(-90deg) scale(1)}50%{transform:rotate(-90deg) scale(1.18)}100%{transform:rotate(-90deg) scale(1)}}
/* Active field spotlight — dims sibling fields when one is focused */
.kz-section .kz-field{transition:opacity 0.22s ease}
.kz-section:focus-within .kz-field:not(:focus-within){opacity:0.42}
.kz-section:focus-within .kz-field:focus-within{opacity:1}
.kz-up-1{animation:kz-up 0.6s 0.05s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-2{animation:kz-up 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-3{animation:kz-up 0.6s 0.25s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-4{animation:kz-up 0.6s 0.35s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-5{animation:kz-up 0.6s 0.45s cubic-bezier(0.22,1,0.36,1) both}
.kz-up-6{animation:kz-up 0.6s 0.55s cubic-bezier(0.22,1,0.36,1) both}
.kz-card{transition:border 0.35s cubic-bezier(0.4,0,0.2,1),box-shadow 0.35s cubic-bezier(0.4,0,0.2,1),transform 0.35s cubic-bezier(0.4,0,0.2,1)}
.kz-input-shimmer{position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(232,41,74,0.9),rgba(255,120,150,1),rgba(232,41,74,0.9),transparent);background-size:300% 100%;animation:kz-shimmer 2.2s linear infinite;border-radius:12px 12px 0 0}
select option{background:#0d0d18;color:rgba(255,255,255,0.9)}
`

// ─── Schema ───────────────────────────────────────────────────────────────────
const optUuid = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional())

const schema = z.object({
  title:               z.string().min(3, 'Title must be at least 3 characters').max(200).optional(),
  plant_id:            z.string().min(1),
  zone_id:             z.string().min(1, 'Select an idea zone'),
  department_id:       z.string().min(1, 'Select an idea department'),
  function_id:         z.string().min(1, 'Select a function'),
  hall_id:             z.string().min(1, 'Select a hall'),
  location_id:         z.string().min(1, 'Select a location'),
  value_stream:        z.string().min(1, 'Select a value stream'),
  category_id:         z.string().min(1, 'Select a category'),
  sub_category_id:     optUuid,
  tag_ids:             z.array(z.string()).default([]),
  problem_statement:   z.string().min(10, 'Minimum 10 characters'),
  description:         z.string().min(10, 'Minimum 10 characters'),
  remarks:             z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  attachment_file_ids: z.array(z.string()).default([]),
})

type FormValues = z.infer<typeof schema>

// ─── DarkInput ────────────────────────────────────────────────────────────────
function DarkInput({
  id, label, type = 'text', value, onChange, readOnly, error, autoFilled,
}: {
  id: string; label: string; type?: string; value: string
  onChange?: (v: string) => void
  readOnly?: boolean; error?: string; autoFilled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  return (
    <div className="flex flex-col gap-1 kz-field">
      <div className="relative rounded-xl" style={{
        background: autoFilled ? 'rgba(255,255,255,0.025)' : focused ? 'rgba(232,41,74,0.04)' : 'rgba(255,255,255,0.025)',
        border: error
          ? '1.5px solid rgba(255,80,80,0.6)'
          : focused ? '1.5px solid rgba(232,41,74,0.6)'
          : autoFilled ? '1.5px solid rgba(255,255,255,0.055)'
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: error
          ? '0 0 0 3px rgba(255,80,80,0.1)'
          : focused ? '0 0 0 3px rgba(232,41,74,0.14),0 2px 20px rgba(232,41,74,0.1)'
          : 'none',
        animation: error ? 'kz-shake 0.4s ease' : 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
      }}>
        {focused && !error && <div className="kz-input-shimmer" />}
        {autoFilled && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.75)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        )}
        <input
          id={id} type={type} value={value}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          className="w-full bg-transparent pt-6 pb-2.5 text-[14px] rounded-xl focus:outline-none placeholder-transparent"
          style={{
            paddingLeft: 14,
            paddingRight: autoFilled ? 44 : 14,
            color: readOnly ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.92)',
            cursor: readOnly ? 'default' : 'text',
          }}
        />
        <label htmlFor={id} className="absolute pointer-events-none font-medium transition-all duration-200" style={{
          left: 14,
          top: lifted ? 7 : '50%',
          transform: lifted ? 'none' : 'translateY(-50%)',
          fontSize: lifted ? '10px' : '13px',
          color: lifted
            ? (error ? 'rgba(255,120,120,0.9)' : focused ? 'rgba(255,160,175,0.9)' : 'rgba(232,41,74,0.85)')
            : 'rgba(255,255,255,0.3)',
          letterSpacing: lifted ? '0.05em' : 'normal',
        }}>{label}</label>
      </div>
      {error && <p className="text-[11px] pl-1 mt-0.5" style={{ color: '#ff8a8a' }}>{error}</p>}
    </div>
  )
}

// ─── DarkSelect ───────────────────────────────────────────────────────────────
function DarkSelect({
  id, label, value, onChange, disabled, children, error, autoFilled,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  disabled?: boolean; children?: React.ReactNode; error?: string; autoFilled?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const hasVal = value !== ''
  return (
    <div className="flex flex-col gap-1 kz-field">
      <div className="relative rounded-xl" style={{
        background: disabled ? 'rgba(255,255,255,0.01)' : focused ? 'rgba(232,41,74,0.04)' : 'rgba(255,255,255,0.025)',
        border: error
          ? '1.5px solid rgba(255,80,80,0.6)'
          : focused ? '1.5px solid rgba(232,41,74,0.6)'
          : autoFilled ? '1.5px solid rgba(255,255,255,0.055)'
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: error ? '0 0 0 3px rgba(255,80,80,0.1)' : focused ? '0 0 0 3px rgba(232,41,74,0.14)' : 'none',
        opacity: disabled ? 0.38 : 1,
        animation: error ? 'kz-shake 0.4s ease' : 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease',
      }}>
        {focused && !error && <div className="kz-input-shimmer" />}
        {autoFilled && hasVal && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.75)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        )}
        <select
          id={id} value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent appearance-none focus:outline-none cursor-pointer"
          style={{ paddingLeft: 14, paddingRight: 36, paddingTop: 22, paddingBottom: 10, fontSize: 14, color: hasVal ? 'rgba(255,255,255,0.92)' : 'transparent' }}
        >
          <option value="" style={{ background: '#0d0d18' }}>—</option>
          {children}
        </select>
        <label htmlFor={id} className="absolute pointer-events-none font-medium transition-all duration-200" style={{
          left: 14,
          top: hasVal ? 7 : '50%',
          transform: hasVal ? 'none' : 'translateY(-50%)',
          fontSize: hasVal ? '10px' : '13px',
          color: hasVal
            ? (error ? 'rgba(255,120,120,0.9)' : focused ? 'rgba(255,160,175,0.9)' : 'rgba(232,41,74,0.85)')
            : 'rgba(255,255,255,0.3)',
          letterSpacing: hasVal ? '0.05em' : 'normal',
        }}>{label}</label>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: focused ? 'rgba(232,41,74,0.6)' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </div>
      {error && <p className="text-[11px] pl-1 mt-0.5" style={{ color: '#ff8a8a' }}>{error}</p>}
    </div>
  )
}

// ─── DarkTextArea ─────────────────────────────────────────────────────────────
function DarkTextArea({
  id, label, value, onChange, rows = 4, error, showCountRing, minCount,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void
  rows?: number; error?: string; showCountRing?: boolean; minCount?: number
}) {
  const [focused, setFocused] = useState(false)
  const lifted = focused || value.length > 0
  return (
    <div className="flex flex-col gap-1 kz-field" style={{ position: 'relative' }}>
      <div className="relative rounded-xl" style={{
        background: focused ? 'rgba(232,41,74,0.04)' : 'rgba(255,255,255,0.025)',
        border: error
          ? '1.5px solid rgba(255,80,80,0.6)'
          : focused ? '1.5px solid rgba(232,41,74,0.6)'
          : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: error ? '0 0 0 3px rgba(255,80,80,0.1)' : focused ? '0 0 0 3px rgba(232,41,74,0.14)' : 'none',
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
          style={{ paddingTop: 28, color: 'rgba(255,255,255,0.92)' }}
        />
        <label htmlFor={id} className="absolute left-4 pointer-events-none font-medium transition-all duration-200" style={{
          top: lifted ? 8 : 18,
          fontSize: lifted ? '10px' : '13px',
          color: lifted
            ? (error ? 'rgba(255,120,120,0.9)' : focused ? 'rgba(255,160,175,0.9)' : 'rgba(232,41,74,0.85)')
            : 'rgba(255,255,255,0.3)',
          letterSpacing: lifted ? '0.05em' : 'normal',
        }}>{label}</label>
        {showCountRing && minCount !== undefined && (
          <CharCountRing value={value} min={minCount} />
        )}
      </div>
      {error && <p className="text-[11px] pl-1 mt-0.5" style={{ color: '#ff8a8a' }}>{error}</p>}
    </div>
  )
}

// ─── SectionCard — progress bar, hover brightening, shimmer, left accent ──────
function SectionCard({ num, title, children, className = '', progress = 0 }: {
  num: string; title: string; children: React.ReactNode
  className?: string; progress?: number
}) {
  const [hovered, setHovered] = useState(false)
  const [shimmerDone, setShimmerDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShimmerDone(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const headerBg = hovered
    ? 'linear-gradient(90deg, rgba(232,41,74,0.09) 0%, rgba(232,41,74,0.02) 60%, transparent 100%)'
    : 'linear-gradient(90deg, rgba(232,41,74,0.045) 0%, transparent 60%)'

  return (
    <div
      className={`rounded-2xl overflow-hidden kz-card ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: 'rgba(8,8,14,0.78)',
        border: hovered ? '1px solid rgba(232,41,74,0.18)' : '1px solid rgba(255,255,255,0.055)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: hovered
          ? '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,41,74,0.09), inset 0 1px 0 rgba(255,255,255,0.09)'
          : '0 4px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: hovered ? 'translateY(-3px) scale(1.002)' : 'translateY(0) scale(1)',
      }}
    >
      {/* Section header */}
      <div className="relative px-6 pt-5 pb-3 flex items-center gap-3 border-b overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.045)', background: headerBg, transition: 'background 0.3s ease' }}>

        {/* One-shot reveal shimmer */}
        {!shimmerDone && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: '60%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)',
              animation: 'kz-section-shimmer 0.9s 0.1s ease-out forwards',
            }} />
          </div>
        )}

        {/* Badge — always shows the number */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(232,41,74,0.28), rgba(192,24,47,0.14))',
          border: '1px solid rgba(232,41,74,0.38)',
          borderRadius: 7,
          padding: '2px 10px',
          boxShadow: `0 0 12px rgba(232,41,74,0.18)${hovered ? ', 0 0 20px rgba(232,41,74,0.12)' : ''}`,
          flexShrink: 0,
          minWidth: 36, textAlign: 'center' as const,
          transition: 'box-shadow 0.3s ease',
        }}>
          <span style={{ color: 'rgba(255,180,190,0.95)', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>{num}</span>
        </div>

        <div className="w-px h-3 flex-shrink-0" style={{ background: 'rgba(232,41,74,0.25)' }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.62)' }}>{title}</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(232,41,74,0.18), transparent)' }} />

        {/* Per-section progress micro-bar */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 1.5, background: 'rgba(255,255,255,0.03)' }}>
          <div style={{
            height: '100%',
            width: `${Math.round(progress * 100)}%`,
            background: `linear-gradient(90deg, ${RED_DARK}, ${RED})`,
            boxShadow: progress > 0 && progress < 1 ? '0 0 6px rgba(232,41,74,0.5)' : 'none',
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.6s cubic-bezier(0.34,1,0.64,1)',
          }} />
        </div>
      </div>

      <div className="p-6 kz-section">{children}</div>
    </div>
  )
}

// ─── Progress Stepper — compact pill row ──────────────────────────────────────
const STEPS = ['Employee', 'Operational', 'Idea', 'Docs']
const SECTION_IDS = ['section-01', 'section-02', 'section-03', 'section-04']

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function ProgressStepper({ completedCount }: { completedCount: number }) {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STEPS.map((label, i) => {
        const done = i < completedCount
        const active = i === completedCount
        const isHovered = hovered === i
        return (
          <div key={label} className="flex items-center gap-1.5">
            {/* Pill — clickable */}
            <button
              type="button"
              onClick={() => scrollToSection(SECTION_IDS[i]!)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 20,
              background: done
                ? 'rgba(232,41,74,0.1)'
                : active
                ? 'rgba(232,41,74,0.14)'
                : 'rgba(255,255,255,0.03)',
              border: done
                ? '1px solid rgba(232,41,74,0.3)'
                : active
                ? '1px solid rgba(232,41,74,0.5)'
                : '1px solid rgba(255,255,255,0.07)',
              boxShadow: active ? '0 0 12px rgba(232,41,74,0.18)' : 'none',
              transform: isHovered ? 'translateY(-1.5px)' : 'translateY(0)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              animation: done ? 'kz-step-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
            }}>
              {/* Icon / number */}
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 15, height: 15,
                fontSize: 9, fontWeight: 800,
                color: done ? 'rgba(232,41,74,0.9)' : active ? 'rgba(232,41,74,0.9)' : 'rgba(255,255,255,0.25)',
              }}>
                {done
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(232,41,74,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span>{i + 1}</span>
                }
              </span>
              {/* Label */}
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
                textTransform: 'uppercase' as const,
                color: done
                  ? 'rgba(255,255,255,0.4)'
                  : active
                  ? 'rgba(255,255,255,0.88)'
                  : 'rgba(255,255,255,0.22)',
                transition: 'color 0.3s ease',
              }}>{label}</span>
            </button>
            {/* Connector arrow — not after last */}
            {i < STEPS.length - 1 && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={i < completedCount ? 'rgba(232,41,74,0.4)' : 'rgba(255,255,255,0.1)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'stroke 0.3s ease', flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Mesh Background — 3 orbs + floating particles ───────────────────────────
const PARTICLES = [
  { x: 3,  b: 18, s: 2.5, dur: 9,  del: 0   },
  { x: 10, b: 55, s: 2,   dur: 12, del: 1.5 },
  { x: 18, b: 30, s: 3,   dur: 10, del: 3   },
  { x: 25, b: 72, s: 2,   dur: 14, del: 0.8 },
  { x: 32, b: 20, s: 2.5, dur: 8,  del: 2.5 },
  { x: 40, b: 85, s: 2,   dur: 11, del: 4   },
  { x: 48, b: 42, s: 3.5, dur: 13, del: 1   },
  { x: 55, b: 65, s: 2,   dur: 15, del: 2.2 },
  { x: 63, b: 15, s: 2.5, dur: 9,  del: 0.5 },
  { x: 70, b: 50, s: 3,   dur: 11, del: 3.5 },
  { x: 78, b: 78, s: 2,   dur: 10, del: 1.8 },
  { x: 84, b: 35, s: 2,   dur: 12, del: 5   },
  { x: 90, b: 60, s: 3,   dur: 8,  del: 0.2 },
  { x: 96, b: 25, s: 2.5, dur: 14, del: 2.8 },
]

function MeshBackground() {
  return (
    <>
      {/* Red — top right */}
      <div className="absolute pointer-events-none" style={{
        top: '-5%', right: '-8%', width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,41,74,0.1) 0%, transparent 70%)',
        filter: 'blur(90px)',
        animation: 'kz-breathe 10s ease-in-out infinite, kz-gradient-shift 20s linear infinite',
        zIndex: 0,
      }} />
      {/* Crimson — bottom left */}
      <div className="absolute pointer-events-none" style={{
        bottom: '10%', left: '-6%', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,24,47,0.08) 0%, transparent 70%)',
        filter: 'blur(100px)',
        animation: 'kz-breathe 14s 2s ease-in-out infinite reverse',
        zIndex: 0,
      }} />
      {/* Violet — mid right */}
      <div className="absolute pointer-events-none" style={{
        top: '38%', right: '-6%', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,40,215,0.07) 0%, transparent 70%)',
        filter: 'blur(120px)',
        animation: 'kz-breathe 12s 3s ease-in-out infinite reverse',
        zIndex: 0,
      }} />
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%, black 30%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%, black 30%, transparent 100%)',
      }} />
      {/* Floating red micro-particles */}
      {PARTICLES.map((p, i) => (
        <div key={i} className="absolute pointer-events-none rounded-full" style={{
          left: `${p.x}%`,
          bottom: `${p.b}%`,
          width: p.s,
          height: p.s,
          background: `rgba(232,41,74,${0.2 + (i % 4) * 0.1})`,
          boxShadow: `0 0 ${p.s * 3}px rgba(232,41,74,0.35)`,
          animation: `kz-drift ${p.dur}s ${p.del}s ease-in-out infinite`,
          zIndex: 1,
        }} />
      ))}
    </>
  )
}

// ─── Summary Chip ─────────────────────────────────────────────────────────────
function SummaryChip({ label }: { label: string }) {
  return (
    <span style={{
      padding: '3px 11px',
      background: 'rgba(232,41,74,0.12)',
      border: '1px solid rgba(232,41,74,0.3)',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      color: 'rgba(255,180,190,0.92)',
      letterSpacing: '0.02em',
      animation: 'kz-chip-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
    }}>{label}</span>
  )
}

// ─── Char-count ring ──────────────────────────────────────────────────────────
function CharCountRing({ value, min }: { value: string; min: number }) {
  const len = value.length
  const pct = Math.min(len / min, 1)
  const done = len >= min
  const r = 9
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8, width: 22, height: 22, zIndex: 5, pointerEvents: 'none' }}>
      <svg width="22" height="22" viewBox="0 0 22 22" style={{ overflow: 'visible' }}>
        {/* Track */}
        <circle cx="11" cy="11" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
        {/* Progress arc */}
        <circle cx="11" cy="11" r={r} fill="none"
          stroke={done ? 'rgba(34,197,94,0.75)' : 'rgba(232,41,74,0.7)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.3s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease',
            animation: done ? 'ring-complete 0.4s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          }}
        />
        {/* Checkmark when complete */}
        {done && (
          <path d="M7 11.5l2.5 2.5 5-5" fill="none"
            stroke="rgba(34,197,94,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'kz-fadein 0.25s ease' }}
          />
        )}
      </svg>
    </div>
  )
}

// ─── Submit success screen ────────────────────────────────────────────────────
function SubmitSuccessScreen({
  result, onNew, onView,
}: { result: CreateIdeaResult; onNew: () => void; onView: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(result.registration_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '70vh', animation: 'kz-up 0.6s cubic-bezier(0.22,1,0.36,1)' }}>
      <div style={{
        maxWidth: 460, width: '100%',
        background: 'rgba(8,8,14,0.9)',
        border: '1px solid rgba(232,41,74,0.2)',
        borderRadius: 20,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(232,41,74,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
        padding: '40px 36px',
        textAlign: 'center' as const,
      }}>
        {/* Success icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(34,197,94,0.1)',
          border: '1.5px solid rgba(34,197,94,0.3)',
          boxShadow: '0 0 32px rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        {/* Heading */}
        <h2 style={{
          fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(255,220,225,0.88))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Idea Submitted!</h2>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, marginBottom: 28, lineHeight: 1.5 }}>
          Your idea has been registered and routed for review
        </p>

        {/* Registration ID card */}
        <div style={{
          background: 'rgba(232,41,74,0.07)',
          border: '1px solid rgba(232,41,74,0.22)',
          borderRadius: 12, padding: '16px 20px',
          marginBottom: 16, position: 'relative', overflow: 'hidden',
        }}>
          <div className="kz-input-shimmer" />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'rgba(232,41,74,0.75)', marginBottom: 8 }}>
            Registration ID
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{
              fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 700,
              color: 'rgba(255,255,255,0.95)', letterSpacing: '0.04em',
              textShadow: '0 0 24px rgba(232,41,74,0.45)',
            }}>
              {result.registration_id}
            </span>
            <button
              type="button"
              onClick={() => void copy()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: copied ? 'rgba(34,197,94,0.85)' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}
            >
              {copied
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              }
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', marginTop: 8 }}>
            Save this ID to track your idea's progress
          </p>
        </div>

        {/* Info chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'Current Stage', value: result.current_stage ?? '—' },
            { label: 'Assigned To',   value: result.assigned_to?.full_name ?? 'Pending assignment' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.055)',
              borderRadius: 10, padding: '10px 14px', textAlign: 'left' as const,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)', lineHeight: 1.3 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <button
          type="button"
          onClick={onView}
          style={{
            width: '100%', height: 50, borderRadius: 12, border: 'none', marginBottom: 10,
            background: `linear-gradient(135deg, #ff6b8a, ${RED}, ${RED_DARK})`,
            boxShadow: '0 8px 24px rgba(232,41,74,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            animation: 'kz-btn-pulse 3s ease-in-out infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span>View My Idea</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={onNew}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.22)', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}
        >
          Submit another idea
        </button>
      </div>
    </div>
  )
}

// ─── IntersectionObserver hook ────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Scroll-activated reveal wrapper ─────────────────────────────────────────
function RevealSection({ children, delay = 0, id }: { children: React.ReactNode; delay?: number; id?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} id={id} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.65s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.65s ${delay}ms cubic-bezier(0.22,1,0.36,1)`,
    }}>
      {children}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function IdeaSubmitPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [submitResult, setSubmitResult] = useState<CreateIdeaResult | null>(null)

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:               '',
      plant_id:            user?.plant_id ?? '',
      zone_id:             '',
      department_id:       '',
      function_id:         '',
      hall_id:             '',
      location_id:         '',
      value_stream:        '',
      category_id:         '',
      sub_category_id:     undefined,
      tag_ids:             [],
      problem_statement:   '',
      description:         '',
      remarks:             undefined,
      attachment_file_ids: [],
    },
  })

  const selectedZone  = watch('zone_id')
  const selectedDept  = watch('department_id')
  const selectedFunc  = watch('function_id')
  const selectedHall  = watch('hall_id')
  const selectedCat   = watch('category_id')
  const probStmt      = watch('problem_statement')
  const ideaDesc      = watch('description')
  const attachIds     = watch('attachment_file_ids')

  useEffect(() => {
    setValue('department_id', '')
    setValue('function_id', '')
    setValue('hall_id', '')
    setValue('location_id', '')
  }, [selectedZone, setValue])

  useEffect(() => {
    setValue('function_id', '')
    setValue('hall_id', '')
    setValue('location_id', '')
  }, [selectedDept, setValue])

  useEffect(() => { setValue('hall_id', ''); setValue('location_id', '') }, [selectedFunc, setValue])
  useEffect(() => { setValue('location_id', '') }, [selectedHall, setValue])
  useEffect(() => { setValue('sub_category_id', '') }, [selectedCat, setValue])

  const plantId = user?.plant_id ?? ''

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: () => getMyProfile(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const { data: zones         = [] } = useQuery({ queryKey: ['zones', plantId],       queryFn: () => getZonesByPlant(plantId),                 enabled: !!plantId })
  const { data: depts         = [] } = useQuery({ queryKey: ['depts', selectedZone],  queryFn: () => getDeptsByZone(selectedZone),             enabled: !!selectedZone })
  const { data: funcs         = [] } = useQuery({ queryKey: ['funcs', selectedDept],  queryFn: () => getFunctionsByDept(selectedDept),         enabled: !!selectedDept })
  const { data: halls         = [] } = useQuery({ queryKey: ['halls', selectedFunc],  queryFn: () => getHallsByFunction(selectedFunc ?? ''),   enabled: !!selectedFunc })
  const { data: locations     = [] } = useQuery({ queryKey: ['locs',  selectedHall],  queryFn: () => getLocationsByHall(selectedHall ?? ''),   enabled: !!selectedHall })
  const { data: valueStreams  = [] } = useQuery({ queryKey: ['vstreams', plantId],    queryFn: () => getValueStreams(plantId),                  enabled: !!plantId })
  const { data: categories    = [] } = useQuery({ queryKey: ['categories'],            queryFn: getCategories })
  const { data: subCats       = [] } = useQuery({ queryKey: ['subCats', selectedCat], queryFn: () => getSubCategoriesByCategory(selectedCat),  enabled: !!selectedCat })
  const { data: tags          = [] } = useQuery({ queryKey: ['tags'],                  queryFn: getTags })

  // Auto-fill zone + dept from profile
  const [zoneAutoFilled, setZoneAutoFilled] = useState(false)
  const [deptAutoFilled, setDeptAutoFilled] = useState(false)

  useEffect(() => {
    if (!zoneAutoFilled && profile?.home_zone && zones.length > 0 && !watch('zone_id')) {
      const match = zones.find(z => z.id === profile.home_zone!.id)
      if (match) { setValue('zone_id', match.id); setZoneAutoFilled(true) }
    }
  }, [profile, zones, zoneAutoFilled, setValue, watch])

  useEffect(() => {
    if (!deptAutoFilled && profile?.home_department && depts.length > 0 && !watch('department_id')) {
      const match = depts.find(d => d.id === profile.home_department!.id)
      if (match) { setValue('department_id', match.id); setDeptAutoFilled(true) }
    }
  }, [profile, depts, deptAutoFilled, setValue, watch])

  // ── Section completion + progress ──────────────────────────────────────────
  const sec01Complete = !!profile
  const sec02Complete = !!selectedZone && !!selectedDept && !!selectedFunc && !!selectedHall && !!selectedCat
  const sec03Complete = probStmt.length >= 10 && ideaDesc.length >= 10
  const sec04Complete = (attachIds ?? []).length > 0

  const sec01Progress = sec01Complete ? 1 : 0
  const sec02Progress = useMemo(() => {
    let n = 0
    if (selectedZone) n++; if (selectedDept) n++; if (selectedFunc) n++
    if (selectedHall) n++; if (selectedCat) n++
    return n / 5
  }, [selectedZone, selectedDept, selectedFunc, selectedHall, selectedCat])
  const sec03Progress = useMemo(() => {
    let n = 0
    if (probStmt.length >= 10) n++; if (ideaDesc.length >= 10) n++
    return n / 2
  }, [probStmt, ideaDesc])
  const sec04Progress = sec04Complete ? 1 : 0

  const completedCount = useMemo(() => {
    let done = 0
    if (sec01Complete) done++
    if (sec02Complete) done++
    if (sec03Complete) done++
    if (sec04Complete) done++
    return done
  }, [sec01Complete, sec02Complete, sec03Complete, sec04Complete])

  const isFormReady = completedCount === STEPS.length

  // Tag animation state
  const [tagAnimating, setTagAnimating] = useState<string | null>(null)

  const handleTagToggle = (tagId: string, currentIds: string[], onChange: (v: string[]) => void) => {
    setTagAnimating(tagId)
    setTimeout(() => setTagAnimating(null), 300)
    if (currentIds.includes(tagId)) onChange(currentIds.filter(id => id !== tagId))
    else onChange([...currentIds, tagId])
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await createIdea(values)
      setSubmitResult(res)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Submission failed', 'error')
    }
  }

  const handleReset = () => {
    setSubmitResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFileUploaded = (fileId: string) => {
    const current = watch('attachment_file_ids') ?? []
    setValue('attachment_file_ids', [...current, fileId])
  }

  const handleFileRemoved = (fileId: string) => {
    const current = watch('attachment_file_ids') ?? []
    setValue('attachment_file_ids', current.filter((id) => id !== fileId))
  }

  // Resolved display names for summary strip
  const zoneName     = zones.find(z => z.id === selectedZone)?.name
  const deptName     = depts.find(d => d.id === selectedDept)?.name
  const categoryName = categories.find(c => c.id === selectedCat)?.name

  return (
    <PageTransition>
      <style>{CSS}</style>

      {submitResult && (
        <SubmitSuccessScreen
          result={submitResult}
          onView={() => navigate(`/ideas/${submitResult.id}`)}
          onNew={handleReset}
        />
      )}

      {!submitResult && (
      <div className="w-full max-w-[860px] mx-auto" style={{ position: 'relative', overflow: 'hidden' }}>
        <MeshBackground />

        {/* K watermark — fits inside the container, top-right */}
        <div className="pointer-events-none select-none" style={{
          position: 'absolute', top: 0, right: 0,
          fontSize: 260, fontWeight: 900, lineHeight: 1, zIndex: 0,
          background: 'linear-gradient(135deg, rgba(232,41,74,0.07) 0%, rgba(192,24,47,0.03) 60%, transparent 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>K</div>

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* ── Page header ──────────────────────────────────────────── */}
          <div className="mb-8 kz-up-1">
            {/* Gradient title text */}
            <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight mb-1" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(255,220,225,0.88) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Submit Idea</h1>

            {/* Animated arrow + subtitle */}
            <p className="text-[13px] flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              <span style={{
                color: 'rgba(232,41,74,0.7)', fontSize: 12, fontWeight: 700,
                animation: 'kz-title-arrow 0.6s 0.4s cubic-bezier(0.22,1,0.36,1) both',
                display: 'inline-block',
              }}>→</span>
              Log a kaizen improvement idea through the KIET workflow
            </p>

            {/* Pulsing accent bar */}
            <div className="mt-3 mb-7" style={{
              height: 3, width: 44, borderRadius: 4,
              background: `linear-gradient(90deg, ${RED_DARK}, ${RED}, #ff5577)`,
              animation: 'kz-accent-pulse 2.5s ease-in-out infinite',
            }} />

            <ProgressStepper completedCount={completedCount} />
          </div>

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">

            {/* ── 01 Employee Information ───────────────────────────── */}
            <RevealSection delay={0} id="section-01">
              <SectionCard num="01" title="Employee Information" progress={sec01Progress}>
                {profileLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-[52px] rounded-xl shimmer" />)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <DarkInput id="empId"   label="Employee ID"       value={profile?.employee_id ?? ''} readOnly autoFilled={!!profile} />
                      <DarkInput id="empName" label="Employee Name"      value={profile?.full_name ?? ''}   readOnly autoFilled={!!profile} />
                      <DarkInput id="empZone" label="Zone of Idea Owner" value={profile?.home_zone?.name ?? ''} readOnly autoFilled={!!profile} />
                      <DarkInput id="empHall" label="Hall of Idea Owner" value={profile?.home_hall?.name ?? ''} readOnly autoFilled={!!profile} />
                    </div>
                    <p className="text-[11px] italic" style={{ color: 'rgba(255,255,255,0.18)' }}>
                      Not your details? Contact your system administrator to update your profile.
                    </p>
                  </div>
                )}
              </SectionCard>
            </RevealSection>

            {/* ── 02 Operational Details + Classification ───────────── */}
            <RevealSection delay={80} id="section-02">
              <SectionCard num="02" title="Operational Details" progress={sec02Progress}>
                {zoneAutoFilled && (
                  <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5" style={{
                    background: 'rgba(99,102,241,0.07)',
                    borderLeft: '3px solid rgba(99,102,241,0.55)',
                    borderTop: '1px solid rgba(99,102,241,0.18)',
                    borderRight: '1px solid rgba(99,102,241,0.18)',
                    borderBottom: '1px solid rgba(99,102,241,0.18)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(129,140,248,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-[12px]" style={{ color: 'rgba(165,180,252,0.85)' }}>
                      Zone and department pre-filled from your home location. You can change them if this idea applies elsewhere.
                    </p>
                  </div>
                )}
                <input type="hidden" value={plantId} />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Controller control={control} name="zone_id" render={({ field, fieldState }) => (
                      <DarkSelect id="zone_id" label="Idea Zone *" value={field.value} onChange={field.onChange}
                        error={fieldState.error?.message} autoFilled={zoneAutoFilled && !!field.value}>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </DarkSelect>
                    )} />
                    <Controller control={control} name="department_id" render={({ field, fieldState }) => (
                      <DarkSelect id="dept_id" label="Idea Department *" value={field.value} onChange={field.onChange}
                        disabled={!selectedZone} error={fieldState.error?.message} autoFilled={deptAutoFilled && !!field.value}>
                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </DarkSelect>
                    )} />
                    <Controller control={control} name="function_id" render={({ field, fieldState }) => (
                      <DarkSelect id="func_id" label="Idea Function *" value={field.value} onChange={field.onChange} disabled={!selectedDept} error={fieldState.error?.message}>
                        {funcs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </DarkSelect>
                    )} />
                    <Controller control={control} name="hall_id" render={({ field, fieldState }) => (
                      <DarkSelect id="hall_id" label="Idea Hall *" value={field.value} onChange={field.onChange} disabled={!selectedFunc} error={fieldState.error?.message}>
                        {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </DarkSelect>
                    )} />
                    <Controller control={control} name="location_id" render={({ field, fieldState }) => (
                      <DarkSelect id="loc_id" label="Idea Location *" value={field.value} onChange={field.onChange} disabled={!selectedHall} error={fieldState.error?.message}>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </DarkSelect>
                    )} />
                    <Controller control={control} name="value_stream" render={({ field, fieldState }) => (
                      <DarkSelect id="val_stream" label="Value Stream *" value={field.value} onChange={field.onChange} error={fieldState.error?.message}>
                        {valueStreams.map(vs => <option key={vs.id} value={vs.name}>{vs.name}</option>)}
                      </DarkSelect>
                    )} />
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.045)', margin: '4px 0' }} />

                  <div className="grid grid-cols-2 gap-4">
                    <Controller control={control} name="category_id" render={({ field, fieldState }) => (
                      <DarkSelect id="cat_id" label="Category *" value={field.value} onChange={field.onChange} error={fieldState.error?.message}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </DarkSelect>
                    )} />
                    <Controller control={control} name="sub_category_id" render={({ field }) => (
                      <DarkSelect id="subcat_id" label="Sub-Category" value={field.value ?? ''} onChange={field.onChange} disabled={!selectedCat}>
                        {subCats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </DarkSelect>
                    )} />
                  </div>

                  {tags.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(232,41,74,0.75)' }}>Tags</p>
                      <Controller control={control} name="tag_ids" render={({ field }) => (
                        <div className="flex flex-wrap gap-2">
                          {tags.map(tag => {
                            const checked = field.value.includes(tag.id)
                            const animating = tagAnimating === tag.id
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleTagToggle(tag.id, field.value, field.onChange)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium"
                                style={{
                                  transition: 'background 0.2s ease, border 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                                  animation: animating ? 'kz-tag-pop 0.25s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                                  ...(checked ? {
                                    background: 'rgba(232,41,74,0.18)',
                                    border: '1px solid rgba(232,41,74,0.45)',
                                    color: 'rgba(255,180,190,0.95)',
                                    boxShadow: '0 0 12px rgba(232,41,74,0.18)',
                                  } : {
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.4)',
                                  }),
                                }}
                              >
                                {tag.name}
                              </button>
                            )
                          })}
                        </div>
                      )} />
                    </div>
                  )}
                </div>
              </SectionCard>
            </RevealSection>

            {/* ── 03 Idea Content ───────────────────────────────────── */}
            <RevealSection delay={120} id="section-03">
              <SectionCard num="03" title="Idea Content" progress={sec03Progress}>
                <div className="space-y-4">
                  <Controller control={control} name="title" render={({ field, fieldState }) => (
                    <DarkInput id="idea_title" label="Idea Title (optional — auto-generated if left blank)"
                      value={field.value ?? ''} onChange={field.onChange} error={fieldState.error?.message} />
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller control={control} name="problem_statement" render={({ field, fieldState }) => (
                      <DarkTextArea id="prob_stmt" label="Problem Statement *"
                        value={field.value} onChange={field.onChange}
                        rows={5} error={fieldState.error?.message}
                        showCountRing minCount={10} />
                    )} />
                    <Controller control={control} name="description" render={({ field, fieldState }) => (
                      <DarkTextArea id="idea_desc" label="Idea Description *"
                        value={field.value} onChange={field.onChange}
                        rows={5} error={fieldState.error?.message}
                        showCountRing minCount={10} />
                    )} />
                  </div>
                  <Controller control={control} name="remarks" render={({ field }) => (
                    <DarkTextArea id="remarks" label="Remarks (optional)"
                      value={field.value ?? ''} onChange={field.onChange} rows={3} />
                  )} />
                </div>
              </SectionCard>
            </RevealSection>

            {/* ── 04 Supporting Documents ───────────────────────────── */}
            <RevealSection delay={160} id="section-04">
              <SectionCard num="04" title="Supporting Documents" progress={sec04Progress}>
                <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Attach photos, sketches, or supporting documents — PDF, images, Office files (max 10 MB each)
                </p>
                <FileUpload
                  entityType="idea"
                  onFileUploaded={handleFileUploaded}
                  onFileRemoved={handleFileRemoved}
                />
              </SectionCard>
            </RevealSection>

            {/* ── Submit area ───────────────────────────────────────── */}
            <RevealSection delay={200}>
            <div className="pt-2 pb-8 space-y-3">

              {/* Mini summary strip — appears as fields are filled */}
              {(zoneName || deptName || categoryName) && (
                <div className="flex items-center gap-2 flex-wrap px-1">
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, flexShrink: 0 }}>
                    Submitting for
                  </span>
                  {zoneName     && <SummaryChip label={zoneName} />}
                  {deptName     && <SummaryChip label={deptName} />}
                  {categoryName && <SummaryChip label={categoryName} />}
                </div>
              )}

              {/* "All complete" label — appears when form is ready */}
              {isFormReady && !isSubmitting && (
                <div className="flex items-center justify-center gap-1.5" style={{ animation: 'kz-label-appear 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ color: 'rgba(34,197,94,0.85)', fontSize: 11, fontWeight: 600, letterSpacing: '0.03em' }}>
                    All fields complete — ready to submit
                  </span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden group"
                style={{
                  height: 60,
                  borderRadius: 16,
                  border: 'none',
                  background: isSubmitting
                    ? 'rgba(255,255,255,0.055)'
                    : isFormReady
                    ? `linear-gradient(135deg, #ff7a96 0%, ${RED} 40%, ${RED_DARK} 100%)`
                    : `linear-gradient(135deg, #ff6b8a 0%, ${RED} 45%, ${RED_DARK} 100%)`,
                  animation: isSubmitting ? 'none' : isFormReady ? 'kz-ready-ring 2s ease-in-out infinite' : 'kz-btn-pulse 3s ease-in-out infinite',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 16, fontWeight: 700, letterSpacing: '0.03em',
                  color: isSubmitting ? 'rgba(255,255,255,0.4)' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  transition: 'background 0.4s ease',
                }}
              >
                {!isSubmitting && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.13) 50%, transparent 80%)',
                      backgroundSize: '200% 100%',
                      animation: 'kz-shimmer 1.4s linear infinite',
                    }}
                  />
                )}
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    <span>Submit Idea</span>
                    <svg
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/ideas')}
                  className="text-[12px] transition-colors duration-200 bg-transparent border-none cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                >
                  Cancel
                </button>
              </div>
            </div>
            </RevealSection>

          </form>
        </div>
      </div>
      )}

    </PageTransition>
  )
}
