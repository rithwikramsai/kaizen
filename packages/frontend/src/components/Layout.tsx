import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth.js'
import { getUnreadCount } from '../api/notifications.js'

// ─── Theme ────────────────────────────────────────────────────────────────────
const RED = '#e8294a'

// ─── Global scrollbar + sidebar CSS ──────────────────────────────────────────
const SCROLLBAR_CSS = `
/* Global scrollbar — slim red thread */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
::-webkit-scrollbar-thumb { background: rgba(232,41,74,0.35); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(232,41,74,0.65); }
::-webkit-scrollbar-corner { background: transparent; }
* { scrollbar-width: thin; scrollbar-color: rgba(232,41,74,0.35) transparent; }

/* Nav active animations */
@keyframes nav-shimmer {
  0%   { background-position: -220% center; }
  100% { background-position: 220% center; }
}
@keyframes nav-slide-in {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes border-rotate {
  to { --border-angle: 1turn; }
}
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0turn;
  inherits: false;
}
.nav-active {
  position: relative;
  animation: nav-slide-in 0.22s cubic-bezier(0.34,1.56,0.64,1);
}
/* One-shot diagonal shimmer on enter */
.nav-active::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(
    105deg,
    transparent 0%,
    transparent 28%,
    rgba(255,255,255,0.08) 42%,
    rgba(255,255,255,0.16) 50%,
    rgba(255,255,255,0.08) 58%,
    transparent 72%,
    transparent 100%
  );
  background-size: 240% 100%;
  animation: nav-shimmer 0.7s ease-out forwards;
  pointer-events: none;
  z-index: 2;
}
/* Rotating red comet around the border — always on while tab is active */
.nav-active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  padding: 1.5px;
  background: conic-gradient(
    from var(--border-angle),
    transparent 0%,
    transparent 30%,
    rgba(232,41,74,0.0) 38%,
    rgba(232,41,74,0.7) 46%,
    rgba(255,130,155,1) 50%,
    rgba(232,41,74,0.7) 54%,
    rgba(232,41,74,0.0) 62%,
    transparent 70%,
    transparent 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  animation: border-rotate 3s linear infinite;
  pointer-events: none;
  z-index: 3;
}
`

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z" />
      <path d="M5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="11" />
      <path d="M7 4H17l-1 6a4 4 0 01-8 0z" />
      <path d="M5 4h2M17 4h2" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function PieChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 118 2.83" />
      <path d="M22 12A10 10 0 0012 2v10z" />
    </svg>
  )
}

function TrendingUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function AlertCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}

function GitBranchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 01-9 9" />
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3L2 6M22 6l-3-3M12 2v1" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 11-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

// ─── KIET Logo — red gradient ─────────────────────────────────────────────────
function KietLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hexGradLayout" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="60%" stopColor="#e8294a" />
          <stop offset="100%" stopColor="#c0182f" />
        </linearGradient>
      </defs>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11"
        fill="url(#hexGradLayout)"
        style={{ filter: 'drop-shadow(0 0 8px rgba(232,41,74,0.5))' }} />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="17" fontWeight="800" fontFamily="Inter, sans-serif">K</text>
    </svg>
  )
}

// ─── NavItem — icon badge + gradient glow active state ───────────────────────
function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => isActive ? 'nav-active' : ''}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingTop: 8,
        paddingBottom: 8,
        paddingRight: 12,
        paddingLeft: 10,
        marginRight: 8,
        marginLeft: 8,
        marginBottom: 2,
        fontSize: 13,
        fontWeight: isActive ? 600 : 450,
        letterSpacing: isActive ? '0.005em' : '0.01em',
        borderRadius: 10,
        // Crown glow card — white border, red inner-top crown + outer glow
        border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        background: isActive ? 'rgba(255,255,255,0.058)' : 'transparent',
        backdropFilter: isActive ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: isActive ? 'blur(12px)' : 'none',
        boxShadow: isActive
          ? 'inset 0 1px 0 rgba(232,41,74,0.55), 0 2px 20px rgba(232,41,74,0.14), 0 6px 24px rgba(0,0,0,0.3)'
          : 'none',
        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.38)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        textDecoration: 'none',
        cursor: 'pointer',
        userSelect: 'none',
      })}
      onMouseEnter={e => {
        const el = e.currentTarget
        const active = el.getAttribute('aria-current') === 'page'
        if (!active) {
          el.style.color = 'rgba(255,255,255,0.72)'
          el.style.background = 'rgba(232,41,74,0.07)'
          el.style.borderColor = 'rgba(232,41,74,0.14)'
          el.style.transform = 'translateY(-1.5px)'
          el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.22)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        const active = el.getAttribute('aria-current') === 'page'
        if (!active) {
          el.style.color = 'rgba(255,255,255,0.38)'
          el.style.background = 'transparent'
          el.style.borderColor = 'transparent'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }
      }}
    >
      {({ isActive }) => (
        <>
          {/* Icon badge — lights up when active */}
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 7,
            flexShrink: 0,
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            ...(isActive ? {
              background: 'linear-gradient(135deg, rgba(232,41,74,0.22), rgba(192,24,47,0.12))',
              border: '1px solid rgba(232,41,74,0.32)',
              boxShadow: '0 0 12px rgba(232,41,74,0.22), inset 0 1px 0 rgba(255,255,255,0.1)',
              color: RED,
            } : {
              background: 'transparent',
              border: '1px solid transparent',
              color: 'rgba(255,255,255,0.35)',
            }),
          }}>
            {icon}
          </span>

          <span style={{ letterSpacing: 'inherit', flex: 1 }}>{label}</span>

          {/* Active right dot */}
          {isActive && (
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: RED,
              boxShadow: `0 0 7px ${RED}`,
              flexShrink: 0,
              opacity: 0.85,
            }} />
          )}
        </>
      )}
    </NavLink>
  )
}

// ─── Avatar — red gradient ────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #ff4d6d, #e8294a, #c0182f)',
        boxShadow: '0 0 12px rgba(232,41,74,0.4)',
      }}
    >
      {initials}
    </div>
  )
}

// ─── Bell with live unread count ──────────────────────────────────────────────
function BellButton() {
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const count = data?.count ?? 0

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative p-2 rounded-lg transition-all duration-200"
      style={{ color: 'rgba(255,255,255,0.45)' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent' }}
      aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
    >
      <BellIcon size={19} />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full ring-2 ring-[#09090f] flex items-center justify-center text-[9px] font-bold text-white leading-none"
          style={{ background: RED }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

// ─── Nav section label ────────────────────────────────────────────────────────
function NavSection({ label }: { label: string }) {
  return (
    <div style={{ padding: '10px 16px 4px', fontSize: 9, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.2)' }}>
      {label}
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function Layout() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.full_name ?? user?.email ?? 'User'

  return (
    <>
      <style>{SCROLLBAR_CSS}</style>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#09090f' }}>

        {/* ── Topbar ── */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 z-20"
          style={{
            background: 'rgba(9,9,15,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.055)',
          }}>

          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <KietLogo size={32} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[17px] leading-none" style={{ color: 'rgba(255,255,255,0.95)' }}>KAIZEN</span>
              <span className="text-xs font-semibold tracking-wide leading-none" style={{ color: 'rgba(232,41,74,0.75)' }}>Platform</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <BellButton />

            {/* User chip */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <Avatar name={displayName} />
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {displayName}
              </span>
            </div>

            {/* Logout */}
            <div className="relative group">
              <button
                onClick={() => void handleLogout()}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ background: 'rgba(232,41,74,0.08)', border: '1px solid rgba(232,41,74,0.18)', color: 'rgba(232,41,74,0.75)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,41,74,0.16)'; e.currentTarget.style.color = RED }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,41,74,0.08)'; e.currentTarget.style.color = 'rgba(232,41,74,0.75)' }}
                aria-label="Sign out"
              >
                <PowerIcon />
              </button>
              <div className="absolute right-0 top-full mt-1.5 px-2 py-1 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: 'rgba(14,14,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                Sign out
              </div>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Sidebar ── */}
          <aside className="w-[220px] flex-shrink-0 flex flex-col overflow-y-auto"
            style={{
              background: 'rgba(9,9,15,0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(255,255,255,0.055)',
            }}>

            {/* Subtle ambient red glow — top of sidebar */}
            <div className="pointer-events-none flex-shrink-0" style={{
              height: 160, position: 'absolute', left: 0, top: 64, width: 220,
              background: 'radial-gradient(ellipse 80% 60% at 10% 0%, rgba(232,41,74,0.07) 0%, transparent 100%)',
              zIndex: 0,
            }} />

            <nav className="flex flex-col pt-3 pb-4 flex-1 relative z-10">
              <NavSection label="Workspace" />
              <NavItem to="/ideas/new"  icon={<SparklesIcon />}  label="Submit Idea" />
              <NavItem to="/ideas"      icon={<DocumentIcon />}  label="My Ideas"    end />
              <NavItem to="/ideas/all"  icon={<GridIcon />}      label="All Ideas" />

              {(hasPermission('CAN_APPROVE_IDEA') || hasPermission('CAN_REVIEW_SAFETY') || hasPermission('CAN_REVIEW_QUALITY') || hasPermission('CAN_REVIEW_IMPLEMENTATION') || hasPermission('CAN_REVIEW_SME')) && (
                <NavItem to="/review"   icon={<InboxIcon />}     label="Review Queue" />
              )}
              {(hasPermission('CAN_SUBMIT_ONE_PAGER') || hasPermission('CAN_MARK_IMPLEMENTED') || hasPermission('CAN_REVIEW_IMPLEMENTATION')) && (
                <NavItem to="/kaizens"    icon={<WrenchIcon />}    label="Implementation" />
              )}

              {(hasPermission('CAN_ASSIGN_REWARD') || hasPermission('CAN_NOMINATE_HIGH_IMPACT') || hasPermission('CAN_VIEW_REPORTS')) && (
                <>
                  <NavSection label="Recognition" />
                  <NavItem to="/rewards"           icon={<TrophyIcon />}    label="Rewards" />
                </>
              )}
              {hasPermission('CAN_RATE_HIGH_IMPACT') && (
                <NavItem to="/rewards/sc-ratings"  icon={<StarIcon />}      label="SC Ratings" />
              )}
              {(hasPermission('CAN_ASSIGN_REWARD') || hasPermission('CAN_VIEW_REPORTS')) && (
                <NavItem to="/rewards/history"     icon={<ClockIcon />}     label="Reward History" />
              )}
              {(hasPermission('CAN_ASSIGN_REWARD') || hasPermission('CAN_VIEW_REPORTS')) && (
                <NavItem to="/rewards/leaderboard" icon={<BarChartIcon />}  label="Leaderboard" />
              )}

              {hasPermission('CAN_VIEW_REPORTS') && (
                <>
                  <NavSection label="Insights" />
                  <NavItem to="/reports/dashboard"  icon={<PieChartIcon />}    label="Dashboard" />
                  <NavItem to="/reports/analytics"  icon={<TrendingUpIcon />}  label="Analytics" />
                  <NavItem to="/reports/sla"        icon={<AlertCircleIcon />} label="SLA Report" />
                </>
              )}

              <NavSection label="General" />
              <NavItem to="/notifications" icon={<BellIcon size={16} />} label="Notifications" />

              {(hasPermission('CAN_MANAGE_USERS') || hasPermission('CAN_MANAGE_MASTER_DATA') || hasPermission('CAN_VIEW_REPORTS')) && (
                <>
                  <NavSection label="Admin" />
                  {hasPermission('CAN_MANAGE_USERS') && (
                    <NavItem to="/admin"              icon={<ShieldIcon />}    label="Overview"      end />
                  )}
                  {hasPermission('CAN_MANAGE_USERS') && (
                    <NavItem to="/admin/users"        icon={<UsersIcon />}     label="Users" />
                  )}
                  {hasPermission('CAN_MANAGE_MASTER_DATA') && (
                    <NavItem to="/admin/master-data"  icon={<DatabaseIcon />}  label="Master Data" />
                  )}
                  {hasPermission('CAN_MANAGE_MASTER_DATA') && (
                    <NavItem to="/admin/workflows"    icon={<GitBranchIcon />} label="Workflows" />
                  )}
                  {hasPermission('CAN_MANAGE_MASTER_DATA') && (
                    <NavItem to="/admin/sla"          icon={<TimerIcon />}     label="SLA Config" />
                  )}
                  {hasPermission('CAN_VIEW_REPORTS') && (
                    <NavItem to="/admin/audit"        icon={<FileTextIcon />}  label="Audit Log" />
                  )}
                  {hasPermission('CAN_MANAGE_USERS') && (
                    <NavItem to="/admin/health"       icon={<ActivityIcon />}  label="System Health" />
                  )}
                </>
              )}
            </nav>


          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 overflow-auto p-6" style={{ background: '#09090f' }}>
            <Outlet />
          </main>

        </div>
      </div>
    </>
  )
}
