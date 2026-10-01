import type { ReactNode } from 'react'

type IconDef = { paths: ReactNode; fill?: boolean; strokeWidth?: number }

const ICONS = {
  home: { paths: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  calendar: {
    paths: (
      <>
        <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
        <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
      </>
    ),
  },
  chart: { paths: <path d="M5 20V11M11 20V5M17 20v-6M3 20h18" /> },
  back: { paths: <path d="M15 5l-7 7 7 7" />, strokeWidth: 2.2 },
  close: { paths: <path d="M6 6l12 12M18 6 6 18" />, strokeWidth: 2.2 },
  check: { paths: <path d="M5 12.5l4.5 4.5L19 7.5" />, strokeWidth: 2.6 },
  arrowRight: { paths: <path d="M5 12h14M13 6l6 6-6 6" />, strokeWidth: 2.2 },
  clock: {
    paths: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  flame: {
    paths: (
      <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.3-4.6.3 1.7 1.2 2.6 2.2 2.9C11 9 11 6 12 3z" />
    ),
  },
  bell: {
    paths: (
      <>
        <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </>
    ),
  },
  lock: {
    paths: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
  },
  breath: {
    paths: (
      <>
        <path d="M4 12c3-4 5-4 8 0s5 4 8 0" />
        <path d="M4 17c3-4 5-4 8 0s5 4 8 0" />
      </>
    ),
  },
  play: { paths: <path d="M8 5.5v13l11-6.5z" />, fill: true },
  pause: {
    paths: (
      <>
        <rect x="6" y="5" width="4" height="14" rx="1.2" />
        <rect x="14" y="5" width="4" height="14" rx="1.2" />
      </>
    ),
    fill: true,
  },
  skipNext: {
    paths: (
      <>
        <path d="M6 5.5v13l9-6.5z" />
        <rect x="16.5" y="5" width="2.5" height="14" rx="1" />
      </>
    ),
    fill: true,
  },
  skipPrev: {
    paths: (
      <>
        <path d="M18 5.5v13l-9-6.5z" />
        <rect x="5" y="5" width="2.5" height="14" rx="1" />
      </>
    ),
    fill: true,
  },
} satisfies Record<string, IconDef>

export type IconName = keyof typeof ICONS

type IconProps = { name: IconName; size?: number; label?: string; className?: string }

export function Icon({ name, size = 20, label, className }: IconProps) {
  const def: IconDef = ICONS[name]
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={def.fill ? 'currentColor' : 'none'}
      stroke={def.fill ? undefined : 'currentColor'}
      strokeWidth={def.fill ? undefined : (def.strokeWidth ?? 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...a11y}
    >
      {def.paths}
    </svg>
  )
}
