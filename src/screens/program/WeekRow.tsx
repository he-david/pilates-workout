import { assessmentDescription } from '../../content/program'
import type { WeekRow as WeekRowData } from '../../domain/programView'
import { sessionStatus } from '../../domain/schedule'
import type { ProgramSession, SessionLog } from '../../domain/types'
import { Icon } from '../../ui'
import { SessionRow } from './SessionRow'

type Props = {
  row: WeekRowData
  expanded: boolean
  onToggle: () => void
  program: readonly ProgramSession[]
  logs: readonly SessionLog[]
  days: readonly string[]
  todayOpen: boolean
}

function Badge({ row }: { row: WeekRowData }) {
  if (row.status === 'done') {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
        <Icon name="check" size={15} label="kész" />
      </span>
    )
  }
  const current = row.status === 'current'
  return (
    <span
      className={`box-border flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
        current
          ? 'border-[2.5px] border-accent-ink text-accent-ink'
          : 'border-2 border-border-dashed font-bold text-ink-muted'
      }`}
    >
      {row.week}
    </span>
  )
}

export function WeekRow({ row, expanded, onToggle, program, logs, days, todayOpen }: Props) {
  const current = row.status === 'current'
  const surface = current
    ? 'bg-accent-soft'
    : row.status === 'done'
      ? 'bg-bg'
      : 'border border-dashed border-border-dashed'
  const label = `${row.week}. hét${current ? ' · e hét' : ''}${
    row.isAssessment && row.status !== 'done' ? ' · Felmérő hét' : ''
  }`
  return (
    <div className={`flex flex-col rounded-lg ${surface}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left"
      >
        <Badge row={row} />
        <span className="flex grow flex-col">
          <span className={`text-md text-ink ${current ? 'font-extrabold' : 'font-bold'}`}>
            {label}
          </span>
          {row.isAssessment && row.status !== 'done' && (
            <span className="text-sm font-normal text-ink-muted">{assessmentDescription}</span>
          )}
        </span>
        {(row.status !== 'upcoming' || !row.isAssessment) && (
          <span className={`text-sm ${current ? 'font-bold text-ink' : 'text-ink-muted'}`}>
            {row.doneCount} / {row.total}
          </span>
        )}
      </button>
      {expanded && (
        <div className="flex flex-col pr-3 pb-2 pl-[52px]">
          {row.sessions.map((s, i) => {
            const status = sessionStatus(s, program, logs)
            return (
              <SessionRow
                key={s.id}
                session={s}
                status={status}
                day={days[i]}
                isToday={status === 'next' && todayOpen}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
