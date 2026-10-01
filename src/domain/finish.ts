import { buildSteps, type FinishSummary } from './player'
import { currentStreak } from './schedule'
import { PLANK_ID, ROLL_UP_ID } from './stats'
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

export type FinishForm = {
  rating: Rating
  areas: readonly string[]
  note: string
  /** Assessment weeks only, raw input text: plank hold in seconds. */
  plankSec?: string
  /** Assessment weeks only, raw input text: clean Roll Up repetitions. */
  rollUpReps?: string
}

export const MAX_PLANK_SEC = 600
export const MAX_ROLL_UP_REPS = 100

/** Whole number 1..max from input text; blank, decimals, negatives, zero and overflow give undefined. */
export function parseMeasure(text: string | undefined, max: number): number | undefined {
  const t = (text ?? '').trim()
  if (!/^\d{1,4}$/.test(t)) return undefined
  const n = Number(t)
  return n >= 1 && n <= max ? n : undefined
}

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
  const hold = parseMeasure(form.plankSec, MAX_PLANK_SEC)
  if (hold !== undefined) log.bestHoldSec = { [PLANK_ID]: hold }
  const reps = parseMeasure(form.rollUpReps, MAX_ROLL_UP_REPS)
  if (reps !== undefined) log.bestReps = { [ROLL_UP_ID]: reps }
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
