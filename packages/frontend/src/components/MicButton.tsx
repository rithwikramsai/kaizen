import { useEffect, useRef, useState } from 'react'

// ─── Web Speech API type stubs ────────────────────────────────────────────────

interface SrResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}
interface SrResultList {
  length: number
  [index: number]: SrResult
}
interface SrResultEvent {
  resultIndex: number
  results: SrResultList
}
interface SrErrorEvent { error: string }
interface SrInstance {
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  lang: string
  onstart:  (() => void) | null
  onend:    (() => void) | null
  onerror:  ((e: SrErrorEvent) => void) | null
  onresult: ((e: SrResultEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}
type SrCtor = new () => SrInstance

function getSR(): SrCtor | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SrCtor | null
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MicButtonProps {
  value: string
  onChange: (newValue: string) => void
  variant?: 'dark' | 'light'
  disabled?: boolean
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MicButton({ value, onChange, variant = 'dark', disabled = false, className = '' }: MicButtonProps) {
  const [listening,  setListening]  = useState(false)
  const [display,    setDisplay]    = useState('')      // interim text for tooltip
  const [notice,     setNotice]     = useState('')

  // Stable refs — speech callbacks read these directly, no stale closures
  const recRef       = useRef<SrInstance | null>(null)
  const valueRef     = useRef(value)
  const onChangeRef  = useRef(onChange)
  const accumulated  = useRef('')    // final transcript built up during the session
  const noticeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { valueRef.current   = value   }, [value])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => () => { recRef.current?.abort() }, [])

  const SR = getSR()

  const flash = (msg: string) => {
    setNotice(msg)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(''), 4000)
  }

  // ── Start ──
  const start = () => {
    if (!SR || recRef.current || disabled) return
    setNotice('')
    accumulated.current = ''

    const rec = new SR()
    recRef.current = rec

    // continuous = true: keeps recording until YOU click stop
    // This is more reliable than continuous = false which auto-stops on silence
    rec.continuous     = true
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.lang = navigator.language || 'en-US'

    rec.onstart = () => setListening(true)

    rec.onresult = (e: SrResultEvent) => {
      let newFinal = ''
      let interim  = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) newFinal += r[0].transcript
        else           interim  += r[0].transcript
      }
      if (newFinal) accumulated.current += (accumulated.current ? ' ' : '') + newFinal.trim()
      // Show live preview: interim first, fall back to what we have so far
      setDisplay(interim || accumulated.current)
    }

    rec.onerror = (e: SrErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        flash('Mic access denied — allow microphone in browser settings')
      } else if (e.error === 'audio-capture') {
        flash('No microphone detected')
      } else if (e.error === 'network') {
        flash('Network error — speech recognition needs internet')
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        flash(`Speech error: ${e.error}`)
      }
      // onend always fires after onerror in Chrome/Edge — cleanup is there
    }

    rec.onend = () => {
      recRef.current = null
      setListening(false)
      setDisplay('')

      // Apply everything accumulated during this session to the field
      const text = accumulated.current.trim()
      if (text) {
        const prev    = valueRef.current.trim()
        const updated = prev ? `${prev} ${text}` : text
        onChangeRef.current(updated)
      }
      accumulated.current = ''
    }

    try {
      rec.start()
    } catch {
      recRef.current = null
      flash('Could not start microphone')
    }
  }

  // ── Stop: triggers onend which applies the transcript ──
  const stop = () => recRef.current?.stop()

  if (!SR) return null

  // ── Styles ──
  const btnBase = 'relative flex items-center justify-center p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2'
  const btnDark = listening
    ? `${btnBase} bg-red-500/20 text-red-400`
    : `${btnBase} bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400`
  const btnLight = listening
    ? `${btnBase} bg-red-50 border border-red-300 text-red-500`
    : `${btnBase} bg-gray-50 border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500`

  const popupBase = 'absolute bottom-full right-0 mb-2 z-30 rounded-xl px-3 py-2 text-xs max-w-[260px] min-w-[120px] border shadow-xl whitespace-normal pointer-events-none'
  const popupDark  = `${popupBase} bg-slate-800 border-white/10 text-slate-200`
  const popupLight = `${popupBase} bg-white border-gray-200 text-gray-700`
  const popupErr   = variant === 'dark' ? `${popupBase} bg-red-900/90 border-red-700/50 text-red-200` : `${popupBase} bg-red-50 border-red-300 text-red-700`

  const showPopup = notice || display || listening

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={listening ? stop : start}
        title={listening ? 'Click to stop and insert text' : 'Click to dictate — speech to text'}
        className={`${variant === 'dark' ? btnDark : btnLight} ${listening ? 'animate-pulse' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <MicIcon active={listening} />
      </button>

      {showPopup && (
        <div className={notice ? popupErr : (variant === 'dark' ? popupDark : popupLight)}>
          {notice ? (
            notice
          ) : display ? (
            <><span className="opacity-40 mr-1">…</span>{display}</>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
              Listening — speak now
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function MicIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8"  y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8"  y1="21" x2="16" y2="21" />
    </svg>
  )
}
