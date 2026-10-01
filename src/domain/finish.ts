import { buildSteps, type FinishSummary } from './player'
import { currentStreak } from './schedule'
import type { ProgramSession, Rating, SessionLog, Settings } from './types'

export type RatingOption = { value: Rating; short: string; label: string; hint: string }

export const RATING_OPTIONS: readonly RatingOption[] = [
  {
    value: 1,
    short: 'Nagyon könnyű',
    label: 'Nagyon könnyű',
    hint: 'A következő edzésen +1 ismétlés vagy hosszabb tartás jön.',
  },
  {
    value: 2,
    short: 'Könnyű',
    label: 'Könnyű',
    hint: 'Ha a héten még egyszer könnyűnek jelölöd, a program előrehozza a nehezebb változatokat.',
  },
  {
    value: 3,
    short: 'Pont jó',
    label: 'Pont jó',
    hint: 'Így tovább — a program a terv szerint halad a következő héttel.',
  },
  {
    value: 4,
    short: 'Nehéz',
    label: 'Nehéz',
    hint: 'A következő edzésen az új gyakorlatoknál felajánljuk a könnyített változatot.',
  },
  {
    value: 5,
    short: 'Túl nehéz',
    label: 'Túl nehéz',
    hint: 'A következő edzés ugyanezen a szinten marad, rövidebb tartásokkal.',
  },
]

export const AREA_OPTIONS: readonly string[] = ['Has', 'Hát', 'Far', 'Comb', 'Váll', 'Nyak']

/** Rating preselected on the finish screen ("Pont jó"), as in the design. */
export const DEFAULT_RATING: Rating = 3

export type FinishForm = { rating: Rating; areas: readonly string[]; note: string }

/** Builds the log to store; areas keep canonical order, an empty note is omitted. */
export function buildLog(summary: FinishSummary, form: FinishForm): SessionLog {
  const note = form.note.trim()
  const log: SessionLog = {
    sessionId: summary.sessionId,
    startedAt: new Date(summary.startedAt).toISOString(),
    finishedAt: new Date(summary.finishedAt).toISOString(),
    durationSec: summary.durationSec,
    completed: [...summary.completed],
    usedEasier: [...summary.usedEasier],
    rating: form.rating,
    areas: AREA_OPTIONS.filter((a) => form.areas.includes(a)),
  }
  if (note) log.note = note
  return log
}

/** Streak as it will be once this session is saved. */
export function streakWithPending(
  settings: Pick<Settings, 'trainingDays'>,
  logs: readonly SessionLog[],
  pending: SessionLog,
  today: Date,
): number {
  return currentStreak(settings, [...logs, pending], today)
}

/** Distinct exercises in a session (the denominator of "14 / 14"). */
export function exerciseCount(session: ProgramSession): number {
  return new Set(buildSteps(session).map((s) => s.exerciseId)).size
}
