import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description: string
  action?: { label: string; to: string }
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">{description}</p>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-indigo-500/20"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
