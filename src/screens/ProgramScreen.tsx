import { phases, program } from '../content/program'
import { useLogs, useSettings, useToday } from '../data'
import { buildWeekRows, weekdayLetters } from '../domain/programView'
import { programProgress, weekView } from '../domain/schedule'
import { PhaseSection } from './program/PhaseSection'
import { ProgressCard } from './program/ProgressCard'

export function ProgramScreen() {
  const today = useToday()
  const settings = useSettings(today)
  const logs = useLogs(today)
  const progress = programProgress(program, logs)
  const rows = buildWeekRows(program, logs)
  const days = weekdayLetters(settings.trainingDays)
  const todayOpen = weekView(settings, logs, today).days.some((d) => d.status === 'today')

  return (
    <main className="flex flex-col gap-[18px] px-5 pt-[max(28px,env(safe-area-inset-top))] pb-5">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight-display">12 hetes program</h1>
        <p className="text-md leading-[1.45] text-ink-muted">
          Heti 3 edzés, egyenként kb. 50 perc. Minden fázis nehezebb az előzőnél, a 4., 8. és 12.
          hét felmérő hét.
        </p>
      </header>
      <ProgressCard progress={progress} />
      {phases.map((info) => (
        <PhaseSection
          key={info.phase}
          info={info}
          progress={progress}
          rows={rows}
          program={program}
          logs={logs}
          days={days}
          todayOpen={todayOpen}
        />
      ))}
    </main>
  )
}
