import type { ReactNode } from 'react'

type ChipProps = { children: ReactNode; tone?: 'outline' | 'muted' | 'pink'; className?: string }

const TONES = {
  outline: 'border border-border bg-surface px-3 py-1.5 text-sm font-bold',
  muted: 'bg-surface-muted px-2.5 py-[5px] text-sm font-semibold',
  pink: 'bg-pink-soft px-2 py-0.5 text-[11px] font-extrabold text-warn-ink',
}

export function Chip({ children, tone = 'outline', className = '' }: ChipProps) {
  return (
    <span className={`inline-flex items-center rounded-full ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}
