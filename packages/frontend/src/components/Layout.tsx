import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z" />
      <path d="M5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function PowerIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 11-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

function KietLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hexGradLayout" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="url(#hexGradLayout)" />
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif">K</text>
    </svg>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl mx-2 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white select-none flex-shrink-0">
      {initials}
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.full_name ?? user?.email ?? 'User'

  return (
    <div className="flex flex-col h-screen bg-[#0f0f23] overflow-hidden">

      {/* ── Topbar ── */}
      <header className="h-16 flex-shrink-0 bg-[#0f0f23]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-20">

        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <KietLogo size={32} />
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-lg leading-none">KIET</span>
            <span className="text-indigo-400 text-xs font-semibold tracking-wide leading-none">Platform</span>
          </div>
        </div>

        {/* Right: Notification + user + logout */}
        <div className="flex items-center gap-3">

          {/* Bell */}
          <button className="relative text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all duration-200">
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0f0f23]" />
          </button>

          {/* User info */}
          <div className="flex items-center gap-2.5 border border-white/8 rounded-xl px-3 py-1.5 bg-white/3">
            <Avatar name={displayName} />
            <span className="text-sm text-slate-300 font-medium hidden sm:block max-w-[120px] truncate">
              {displayName}
            </span>
          </div>

          {/* Logout */}
          <div className="relative group">
            <button
              onClick={() => void handleLogout()}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2 rounded-lg transition-all duration-200 hover:scale-105"
              aria-label="Sign out"
            >
              <PowerIcon />
            </button>
            <div className="absolute right-0 top-full mt-1.5 px-2 py-1 bg-[#1a1a2e] border border-white/10 rounded-lg text-xs text-slate-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Sign out
            </div>
          </div>

        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-[240px] flex-shrink-0 bg-[#1a1a2e] border-r border-white/5 flex flex-col overflow-y-auto">

          {/* Nav items */}
          <nav className="flex flex-col gap-1 pt-4 pb-4 flex-1">
            <NavItem to="/ideas/new" icon={<SparklesIcon />} label="Submit Idea" />
            <NavItem to="/ideas" icon={<DocumentIcon />} label="My Ideas" end />
            <NavItem to="/ideas/all" icon={<GridIcon />} label="All Ideas" />
          </nav>

          {/* Bottom metadata */}
          <div className="px-4 pb-5 border-t border-white/5 pt-4">
            <div className="text-[10px] text-slate-600 font-medium uppercase tracking-widest mb-1">Current Phase</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[11px] text-indigo-400 font-medium">Phase 5 — Ideas</span>
            </div>
            <div className="text-[10px] text-slate-700 mt-2">v0.5.0</div>
          </div>

        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto p-6 bg-[#0f0f23]">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
