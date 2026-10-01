import { useState } from 'react'
import { getExercise } from '../../content/exercises'
import type { PhaseInfo } from '../../content/program'
import { phaseState, type WeekRow as WeekRowData } from '../../domain/programView'
import type { ProgramProgress } from '../../domain/schedule'
import type { ProgramSession, SessionLog } from '../../domain/types'
import { Card, Chip, Icon } from '../../ui'
import { WeekRow } from './WeekRow'

type Props = {
  info: PhaseInfo
  progress: ProgramProgress
  rows: readonly WeekRowData[]
  program: readonly ProgramSession[]
  logs: readonly SessionLog[]
  days: readonly string[]
  todayOpen: boolean
}

export function PhaseSection({ info, progress, rows, program, logs, days, todayOpen }: Props) {
  const state = phaseState(info.phase, progress.currentPhase, progress.complete)
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([progress.currentWeek]))
  const toggle = (week: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(week)) next.add(week)
      return next
    })
  const current = state === 'current'
  const weeks = rows.filter((r) => r.phase === info.phase)
  const names = info.highlights.flatMap((id) => getExercise(id)?.nameHu ?? [])
  return (
    <Card
      as="section"
      className={`flex flex-col !rounded-[22px] ${current ? 'gap-3.5 !border-2 !border-accent' : 'gap-2.5'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div
            className={`text-xs font-extrabold tracking-label-wide uppercase ${current ? 'text-accent-ink' : 'text-ink-muted'}`}
          >
            {info.phase}. fázis · {info.fromWeek}–{info.toWeek}. hét
            {current && ' · Folyamatban'}
            {state === 'done' && ' · Kész'}
          </div>
          <h2 className="text-[21px] font-extrabold">{info.title}</h2>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold whitespace-nowrap text-ink-muted">
          {state === 'locked' && <Icon name="lock" size={16} />}
          <span>Szint {info.level}</span>
        </div>
      </div>
      <p className="text-base leading-[1.45] text-ink-soft">{info.description}</p>
      {state === 'locked' ? (
        names.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Kiemelt gyakorlatok">
            {names.map((n) => (
              <li key={n}>
                <Chip tone="muted">{n}</Chip>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="flex flex-col gap-2">
          {weeks.map((row) => (
            <WeekRow
              key={row.week}
              row={row}
              expanded={open.has(row.week)}
              onToggle={() => toggle(row.week)}
              program={program}
              logs={logs}
              days={days}
              todayOpen={todayOpen}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
