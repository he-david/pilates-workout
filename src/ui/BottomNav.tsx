import { NavLink } from 'react-router'
import { Icon, type IconName } from './Icon'

const ITEMS: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Ma', icon: 'home', end: true },
  { to: '/program', label: 'Program', icon: 'calendar' },
  { to: '/log', label: 'Napló', icon: 'chart' },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Fő navigáció"
      className="flex justify-around border-t border-border bg-surface px-3 pt-2.5 pb-[max(24px,env(safe-area-inset-bottom))]"
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex min-h-12 min-w-20 flex-col items-center justify-center gap-1 text-xs no-underline ${
              isActive ? 'font-extrabold text-accent-ink' : 'font-semibold text-ink-muted'
            }`
          }
        >
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
