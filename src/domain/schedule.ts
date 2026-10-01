import type { Phase, ProgramSession, SessionLog, Settings } from './types'

/**
 * Completion-based schedule. The program advances by finished sessions, never by calendar.
 * All "day" comparisons use the device's local calendar day (Europe/Budapest for the user),
 * built with local Y/M/D arithmetic so DST changes never shift a day.
 */

export type SessionStatus = 'done' | 'next' | 'upcoming'
export type DayStatus = 'done' | 'today' | 'planned' | 'missed' | 'rest'

export type WeekDay = {
  /** 0 = Monday … 6 = Sunday */
  index: number
  /** local day key, "YYYY-MM-DD" */
  date: string
  /** JS weekday, 0 = Sunday … 6 = Saturday (matches Settings.trainingDays) */
  weekday: number
  isTrainingDay: boolean
  isToday: boolean
  /**
   * done: a session was finished that day (wins over everything);
   * today: today, nothing finished yet;
   * planned: future training day; missed: past training day without a log;
   * rest: any other day without a log.
   */
  status: DayStatus
}

export type WeekView = {
  days: WeekDay[]
  /** training days of this week with a finished session (the "n/3" of the hero) */
  doneCount: number
  /** number of training days this week (the "/3") */
  plannedCount: number
}

export type ProgramProgress = {
  done: number
  total: number
  /** 0-100, rounded */
  percent: number
  complete: boolean
  /** week of the next session (last week when complete); 0 for an empty program */
  currentWeek: number
  currentPhase: Phase
  /** next session, undefined when complete */
  next: ProgramSession | undefined
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Local calendar day `offset` days from `d` (calendar arithmetic, DST-safe). */
function addDays(d: Date, offset: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset)
}

function logDayKeys(logs: readonly SessionLog[]): Set<string> {
  return new Set(logs.map((l) => dayKey(new Date(l.finishedAt))))
}

function doneIds(logs: readonly SessionLog[]): Set<string> {
  return new Set(logs.map((l) => l.sessionId))
}

/** First program session without a log; undefined when the program is complete. */
export function nextSession(
  program: readonly ProgramSession[],
  logs: readonly SessionLog[],
): ProgramSession | undefined {
  const done = doneIds(logs)
  return program.find((s) => !done.has(s.id))
}

/** Most recent log of a session (it may have been done more than once); undefined if never. */
export function lastLogOf(sessionId: string, logs: readonly SessionLog[]): SessionLog | undefined {
  return logs
    .filter((l) => l.sessionId === sessionId)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0]
}

export function sessionStatus(
  session: ProgramSession,
  program: readonly ProgramSession[],
  logs: readonly SessionLog[],
): SessionStatus {
  if (doneIds(logs).has(session.id)) return 'done'
  return nextSession(program, logs)?.id === session.id ? 'next' : 'upcoming'
}

/** Mon–Sun week containing `today`. */
export function weekView(
  settings: Pick<Settings, 'trainingDays'>,
  logs: readonly SessionLog[],
  today: Date,
): WeekView {
  const done = logDayKeys(logs)
  const todayKey = dayKey(today)
  const monday = addDays(today, -((today.getDay() + 6) % 7))
  const days: WeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i)
    const date = dayKey(d)
    const isTrainingDay = settings.trainingDays.includes(d.getDay())
    const isToday = date === todayKey
    let status: DayStatus
    if (done.has(date)) status = 'done'
    else if (isToday) status = 'today'
    else if (!isTrainingDay) status = 'rest'
    else status = date > todayKey ? 'planned' : 'missed'
    days.push({ index: i, date, weekday: d.getDay(), isTrainingDay, isToday, status })
  }
  return {
    days,
    doneCount: days.filter((d) => d.isTrainingDay && d.status === 'done').length,
    plannedCount: days.filter((d) => d.isTrainingDay).length,
  }
}

export function programProgress(
  program: readonly ProgramSession[],
  logs: readonly SessionLog[],
): ProgramProgress {
  const done = doneIds(logs)
  const doneCount = program.filter((s) => done.has(s.id)).length
  const total = program.length
  const next = nextSession(program, logs)
  const current = next ?? program[program.length - 1]
  return {
    done: doneCount,
    total,
    percent: total === 0 ? 0 : Math.round((doneCount / total) * 100),
    complete: total > 0 && next === undefined,
    currentWeek: current?.week ?? 0,
    currentPhase: current?.phase ?? 1,
    next,
  }
}

/**
 * Streak = number of consecutive planned training days (Settings.trainingDays), counted back
 * from today, on which a session was finished. Rest days between them never break it.
 * Today's training day, if not done yet, is skipped (still open); a past training day
 * without a log ends the streak. Days before the first log are never counted, so the
 * streak is bounded by the log history. A session finished on a non-training day is
 * ignored by the count (it neither adds to nor breaks the streak).
 */
export function currentStreak(
  settings: Pick<Settings, 'trainingDays'>,
  logs: readonly SessionLog[],
  today: Date,
): number {
  if (logs.length === 0 || settings.trainingDays.length === 0) return 0
  const done = logDayKeys(logs)
  const earliest = [...done].sort()[0] as string
  const todayKey = dayKey(today)
  let streak = 0
  for (let offset = 0; ; offset++) {
    const d = addDays(today, -offset)
    const key = dayKey(d)
    if (key < earliest) break
    if (!settings.trainingDays.includes(d.getDay())) continue
    if (done.has(key)) streak++
    else if (key !== todayKey) break
  }
  return streak
}
