import type { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div style={{ animation: 'pageFadeIn 0.28s ease-out' }}>
      {children}
    </div>
  )
}
