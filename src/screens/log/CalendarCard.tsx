import type { CalendarCell, CalendarStatus } from '../../domain/stats'
import { Card } from '../../ui'

const DOW = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']

// Missed days read like plain days: the design legend only knows Kész / Tervezett.
const CELL: Record<CalendarStatus, string> = {
  done: 'bg-accent font-extrabold text-ink',
  today: 'border-2 border-accent-deep bg-surface font-bold text-ink',
  planned: 'border-2 border-dashed border-ink-faint bg-surface font-bold text-ink',
  missed: 'bg-bg font-medium text-ink-muted',
  none: 'bg-bg font-medium text-ink-muted',
}

type Props = { title: string; days: string; cells: readonly CalendarCell[] }

export function CalendarCard({ title, days, cells }: Props) {
  return (
    <Card as="section" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <span className="text-sm text-ink-muted">{days}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DOW.map((d) => (
          <div key={d} className="text-xs font-bold text-ink-muted">
            {d}
          </div>
        ))}
        {cells.map((c, i) =>
          c ? (
            <div
              key={c.date}
              data-status={c.status}
              className={`box-border flex h-[38px] items-center justify-center rounded-md text-sm ${CELL[c.status]}`}
            >
              {c.day}
            </div>
          ) : (
            <div key={`b${i}`} aria-hidden="true" className="h-[38px]" />
          ),
        )}
      </div>
      <div className="flex gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent" />
          Kész
        </span>
        <span className="flex items-center gap-1.5">
          <span className="box-border h-3 w-3 rounded-sm border-2 border-dashed border-ink-faint" />
          Tervezett
        </span>
      </div>
    </Card>
  )
}
