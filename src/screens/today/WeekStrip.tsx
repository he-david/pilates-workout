import { dayNameLong, dayNameShort } from '../../domain/format'
import type { DayStatus, WeekDay, WeekView } from '../../domain/schedule'
import { Icon } from '../../ui'

const CIRCLE = 'flex h-[38px] w-[38px] items-center justify-center rounded-full text-sm'

const STATUS_LABEL: Record<DayStatus, string> = {
  done: 'kész',
  today: 'ma',
  planned: 'tervezett edzés',
  missed: 'kimaradt',
  rest: 'pihenő',
}

const CIRCLE_CLASS: Record<DayStatus, string> = {
  done: 'bg-accent text-ink',
  today: 'box-border border-[2.5px] border-accent-ink font-extrabold text-accent-ink',
  planned: 'box-border border-2 border-dashed border-ink-faint text-ink',
  missed: 'bg-surface-muted text-ink-muted',
  rest: 'bg-surface-muted text-ink-muted',
}

function Day({ day }: { day: WeekDay }) {
  const dayOfMonth = Number(day.date.slice(8))
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      aria-label={`${dayNameLong(day.weekday)}, ${STATUS_LABEL[day.status]}`}
    >
      <div
        className={`text-xs ${day.isToday ? 'font-extrabold text-ink' : 'font-bold text-ink-muted'}`}
      >
        {dayNameShort(day.weekday)}
      </div>
      <div className={`${CIRCLE} ${CIRCLE_CLASS[day.status]}`}>
        {day.status === 'done' ? <Icon name="check" size={18} /> : dayOfMonth}
      </div>
    </div>
  )
}

type Props = { week: WeekView; nextLabel?: string }

export function WeekStrip({ week, nextLabel }: Props) {
  return (
    <section className="flex flex-col gap-3.5 rounded-3xl border border-border bg-surface p-[18px]">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-extrabold">Ez a hét</h3>
        <div className="text-base font-semibold text-ink-muted">
          {week.doneCount} / {week.plannedCount} kész
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {week.days.map((d) => (
          <Day key={d.date} day={d} />
        ))}
      </div>
      {nextLabel && <div className="text-sm text-ink-muted">{nextLabel}</div>}
    </section>
  )
}
