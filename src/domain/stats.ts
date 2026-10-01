import { durationLabel, monthName } from './format'
import { currentStreak, programProgress } from './schedule'
import type { ProgramSession, Rating, SessionLog, Settings } from './types'

/** Stats for the Log screen. Always computed from logs, never stored. */

export const PLANK_ID = 'forearm-plank'
export const ROLL_UP_ID = 'roll-up'

export type CalendarStatus = 'done' | 'today' | 'planned' | 'missed' | 'none'
/** null = blank cell before the first / after the last day of the range. */
export type CalendarCell = { date: string; day: number; status: CalendarStatus } | null

export type RatingWeek = { week: number; label: string; ratings: Rating[] }
export type RecordRow = { name: string; en: string; from: string; to: string }
export type TrendKind = 'few' | 'easier' | 'stable' | 'harder'
export type Trend = { kind: TrendKind; text: string }

export type Stats = {
  streak: number
  totalSec: number
  totalLabel: string
  done: number
  total: number
  weeks: RatingWeek[]
  trend: Trend
  records: RecordRow[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const byFinished = (a: SessionLog, b: SessionLog) => a.finishedAt.localeCompare(b.finishedAt)
const average = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

export function totalSeconds(logs: readonly SessionLog[]): number {
  return logs.reduce((sum, l) => sum + l.durationSec, 0)
}

/**
 * Month-range calendar, Monday first. Cells are blank (null) before `from` in its week and
 * after `to` in its week. done: a session finished that day (wins); today: today without a log;
 * planned: future training day, only while sessions remain (one per remaining session);
 * missed: past training day (on/after startDate) without a log; none: anything else.
 */
export function calendarCells(
  settings: Pick<Settings, 'trainingDays' | 'startDate'>,
  logs: readonly SessionLog[],
  program: readonly ProgramSession[],
  from: Date,
  to: Date,
  today: Date,
): CalendarCell[] {
  const done = new Set(logs.map((l) => dayKey(new Date(l.finishedAt))))
  const todayKey = dayKey(today)
  const remaining = Math.max(0, program.length - programProgress(program, logs).done)
  // future training days in order, capped to the remaining sessions
  const planned = new Set<string>()
  for (
    let i = 1;
    planned.size < remaining && i <= 7 * 60 && settings.trainingDays.length > 0;
    i++
  ) {
    const d = addDays(today, i)
    if (settings.trainingDays.includes(d.getDay())) planned.add(dayKey(d))
  }
  const cells: CalendarCell[] = Array.from({ length: (from.getDay() + 6) % 7 }, () => null)
  const last = dayKey(to)
  for (let d = from; dayKey(d) <= last; d = addDays(d, 1)) {
    const date = dayKey(d)
    let status: CalendarStatus = 'none'
    if (done.has(date)) status = 'done'
    else if (date === todayKey) status = 'today'
    else if (planned.has(date)) status = 'planned'
    else if (
      date < todayKey &&
      date >= settings.startDate &&
      settings.trainingDays.includes(d.getDay())
    )
      status = 'missed'
    cells.push({ date, day: d.getDate(), status })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** "Szeptember – október" (one name when both ends fall in the same month). */
export function rangeTitle(from: Date, to: Date): string {
  const a = monthName(from.getMonth())
  const first = a.charAt(0).toUpperCase() + a.slice(1)
  return from.getMonth() === to.getMonth() ? first : `${first} – ${monthName(to.getMonth())}`
}

/** Ratings per program week, chronological; the week label is "N. hét". */
export function ratingWeeks(
  logs: readonly SessionLog[],
  program: readonly ProgramSession[],
): RatingWeek[] {
  const weekOf = new Map(program.map((s) => [s.id, s.week]))
  const weeks = new Map<number, Rating[]>()
  for (const l of [...logs].sort(byFinished)) {
    const week = weekOf.get(l.sessionId)
    if (week === undefined) continue
    weeks.set(week, [...(weeks.get(week) ?? []), l.rating])
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, ratings]) => ({ week, label: `${week}. hét`, ratings }))
}

const TREND_TEXT: Record<TrendKind, string> = {
  few: 'Néhány edzés után itt látod, hogyan alakul az érzett nehézség.',
  easier: 'Egyre könnyebbnek érzed — a program hamarosan szintet lép.',
  stable: 'Stabilan „pont jó” körül mozogsz — a program a terv szerint nehezedik.',
  harder: 'Egyre nehezebbnek érzed — ha kell, válaszd a könnyített változatot.',
}

/**
 * Compares the average rating of the last two weeks with the previous two weeks:
 * ≤ −0.5 easier, ≥ +0.5 harder, otherwise stable. With no earlier weeks the overall average
 * decides (< 2.5 easier, > 3.5 harder). Fewer than 3 sessions: not enough data.
 */
export function ratingTrend(weeks: readonly RatingWeek[]): Trend {
  const all = weeks.flatMap((w) => w.ratings)
  const make = (kind: TrendKind): Trend => ({ kind, text: TREND_TEXT[kind] })
  if (all.length < 3) return make('few')
  const recent = weeks.slice(-2).flatMap((w) => w.ratings)
  const earlier = weeks.slice(-4, -2).flatMap((w) => w.ratings)
  if (earlier.length === 0) {
    const avg = average(all)
    return make(avg < 2.5 ? 'easier' : avg > 3.5 ? 'harder' : 'stable')
  }
  const delta = average(recent) - average(earlier)
  return make(delta <= -0.5 ? 'easier' : delta >= 0.5 ? 'harder' : 'stable')
}

/**
 * Records from assessment-week logs (first vs latest): plank hold (bestHoldSec) in seconds and
 * clean Roll Up reps (bestReps). A baseline taken with the easier Roll Up reads "könnyítve".
 * Rows with no measurement yet are left out; a single measurement shows as from = to.
 */
export function assessmentRecords(
  logs: readonly SessionLog[],
  program: readonly ProgramSession[],
): RecordRow[] {
  const assessment = new Set(program.filter((s) => s.isAssessment).map((s) => s.id))
  const mine = logs.filter((l) => assessment.has(l.sessionId)).sort(byFinished)
  const rows: RecordRow[] = []

  const holds = mine.flatMap((l) => l.bestHoldSec?.[PLANK_ID] ?? [])
  const firstHold = holds[0]
  const lastHold = holds[holds.length - 1]
  if (firstHold !== undefined && lastHold !== undefined)
    rows.push({
      name: 'Alkartámasz',
      en: 'Forearm Plank',
      from: `${firstHold} mp`,
      to: `${lastHold} mp`,
    })

  const withReps = mine.filter((l) => l.bestReps?.[ROLL_UP_ID] !== undefined)
  const firstRoll = mine.find(
    (l) => l.bestReps?.[ROLL_UP_ID] !== undefined || l.usedEasier.includes(ROLL_UP_ID),
  )
  const latest = withReps[withReps.length - 1]?.bestReps?.[ROLL_UP_ID]
  if (firstRoll && latest !== undefined) {
    const base = firstRoll.bestReps?.[ROLL_UP_ID]
    rows.push({
      name: 'Felgördülés',
      en: 'Roll Up',
      from: base === undefined ? 'könnyítve' : `${base} tiszta ism.`,
      to: `${latest} tiszta ism.`,
    })
  }
  return rows
}

export function computeStats(
  settings: Pick<Settings, 'trainingDays'>,
  logs: readonly SessionLog[],
  program: readonly ProgramSession[],
  today: Date,
): Stats {
  const progress = programProgress(program, logs)
  const weeks = ratingWeeks(logs, program)
  const totalSec = totalSeconds(logs)
  return {
    streak: currentStreak(settings, logs, today),
    totalSec,
    totalLabel: durationLabel(totalSec),
    done: progress.done,
    total: progress.total,
    weeks,
    trend: ratingTrend(weeks),
    records: assessmentRecords(logs, program),
  }
}
