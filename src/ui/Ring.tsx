import type { ReactNode } from 'react'

type RingProps = {
  /** 0..1 */
  progress: number
  size?: number
  stroke?: number
  trackColor?: string
  color?: string
  children?: ReactNode
}

/** Progress ring. Defaults match the Program screen (64px, stroke 7). */
export function Ring({
  progress,
  size = 64,
  stroke = 7,
  trackColor = 'var(--color-track)',
  color = 'var(--color-accent)',
  children,
}: RingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(1, Math.max(0, progress))
  const mid = size / 2
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={mid} cy={mid} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      ) : null}
    </div>
  )
}
