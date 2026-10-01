import { program } from '../content/program'
import { useLogs, useSettings, useToday } from '../data'
import { weekdayLetters } from '../domain/programView'
import { calendarCells, calendarWindow, computeStats, rangeTitle } from '../domain/stats'
import { BackupCard } from './log/BackupCard'
import { CalendarCard } from './log/CalendarCard'
import { RatingChart } from './log/RatingChart'
import { RecordsCard } from './log/RecordsCard'
import { StatTiles } from './log/StatTiles'

export function LogScreen() {
  const today = useToday()
  const settings = useSettings(today)
  const logs = useLogs(today)
  if (!logs) return null
  const stats = computeStats(settings, logs, program, today)
  const { from, to } = calendarWindow(today)
  const cells = calendarCells(settings, logs, program, from, to, today)

  return (
    <main className="flex flex-col gap-[18px] px-5 pt-[max(28px,env(safe-area-inset-top))] pb-5">
      <h1 className="text-3xl font-extrabold tracking-tight-display">Napló</h1>
      <StatTiles stats={stats} />
      <CalendarCard
        title={rangeTitle(from, to)}
        days={weekdayLetters(settings.trainingDays).join(' · ')}
        cells={cells}
      />
      <RatingChart weeks={stats.weeks} trend={stats.trend} />
      <RecordsCard records={stats.records} />
      <BackupCard lastBackupAt={settings.lastBackupAt} logCount={logs.length} now={today} />
    </main>
  )
}
