import { program, WEEKS } from '../content/program'
import { useLogs, useSettings, useToday } from '../data'
import { dayNameLong, dateHeader } from '../domain/format'
import { currentStreak, programProgress, weekView } from '../domain/schedule'
import { weekFractions } from '../domain/todaySummary'
import { Icon } from '../ui'
import { headline } from './today/headline'
import { HeroCard } from './today/HeroCard'
import { PhaseCard } from './today/PhaseCard'
import { ReminderCard } from './today/ReminderCard'
import { WeekStrip } from './today/WeekStrip'

export function TodayScreen() {
  const today = useToday()
  const settings = useSettings(today)
  const logs = useLogs(today)

  const progress = programProgress(program, logs)
  const week = weekView(settings, logs, today)
  const todayDay = week.days.find((d) => d.isToday)
  const streak = currentStreak(settings, logs, today)

  // Session after the hero one when today's workout is still open, else the hero one itself.
  const nextIndex = progress.next ? program.indexOf(progress.next) : -1
  const afterToday = todayDay?.status === 'today' ? nextIndex + 1 : nextIndex
  const upcoming = nextIndex >= 0 ? program[afterToday] : undefined
  const nextDay = week.days.find((d) => d.status === 'planned')
  const nextLabel =
    upcoming && nextDay
      ? `Következő: ${dayNameLong(nextDay.weekday).toLowerCase()} · ${upcoming.title}`
      : undefined

  return (
    <main className="flex flex-col gap-[18px] px-5 pt-[max(28px,env(safe-area-inset-top))] pb-5">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold text-ink-muted">{dateHeader(today)}</div>
          <h1 className="max-w-[230px] text-3xl leading-[1.15] font-extrabold tracking-tight-display">
            {headline(todayDay?.status, progress.complete)}
          </h1>
        </div>
        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 rounded-full border border-pink-border bg-pink-soft px-3 py-2 text-md font-extrabold text-warn-ink"
            aria-label={`${streak} edzésnapos sorozat`}
          >
            <Icon name="flame" size={18} />
            <span>{streak}</span>
          </div>
        )}
      </header>
      {progress.next && <HeroCard session={progress.next} />}
      <WeekStrip week={week} nextLabel={nextLabel} />
      <PhaseCard progress={progress} fractions={weekFractions(program, logs, WEEKS)} />
      <ReminderCard trainingDays={settings.trainingDays} time={settings.reminderTime ?? '18:30'} />
    </main>
  )
}
