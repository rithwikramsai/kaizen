import { createContext, useCallback, useState, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastCtx {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastCtx>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

const TOAST_STYLES: Record<ToastType, { bar: string; iconCls: string; icon: string }> = {
  success: { bar: 'bg-emerald-500', iconCls: 'bg-emerald-500/20 text-emerald-400', icon: '✓' },
  error:   { bar: 'bg-red-500',     iconCls: 'bg-red-500/20 text-red-400',         icon: '✕' },
  warning: { bar: 'bg-amber-500',   iconCls: 'bg-amber-500/20 text-amber-400',     icon: '⚠' },
  info:    { bar: 'bg-indigo-500',  iconCls: 'bg-indigo-500/20 text-indigo-400',   icon: 'ℹ' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => removeToast(id), 4500)
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-sm rounded-2xl bg-[#1a1a2e]/95 border border-white/10 shadow-2xl overflow-hidden"
              style={{ animation: 'slideInRight 0.25s ease-out' }}
            >
              <div className={`w-1 self-stretch flex-shrink-0 ${s.bar}`} />
              <div className={`w-7 h-7 mt-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${s.iconCls}`}>
                {s.icon}
              </div>
              <p className="flex-1 text-sm text-slate-200 py-3.5 pr-1 leading-relaxed">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-600 hover:text-slate-300 p-3.5 transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
