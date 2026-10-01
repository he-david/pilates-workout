import type { ReactNode } from 'react'

type CardProps = { children: ReactNode; className?: string; as?: 'div' | 'section' }

/** White surface card: 20px radius, 1px border, 18px padding (design default). */
export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`rounded-3xl border border-border bg-surface p-[18px] ${className}`}>
      {children}
    </Tag>
  )
}
