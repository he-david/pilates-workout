import { doseLabel } from './format'
import { buildOverview, type PrescriptionFlags } from './sessionOverview'
import { previousSameSlot, sessionItems } from './todaySummary'
import type { Exercise, ProgramSession, SessionLog } from './types'

/** Pure helpers behind the exercise detail screen. */

export type StepPart = { text: string; bold: boolean }

const BREATH_PREFIX = /((?:Belégzés|Kilégzés)(?:, majd (?:be|ki)légzés)?:)/

/** Splits a step so breathing prefixes ("Belégzés:", "Belégzés, majd kilégzés:") can be bold. */
export function parseStep(step: string): StepPart[] {
  return step
    .split(BREATH_PREFIX)
    .map((text, i) => ({ text, bold: i % 2 === 1 }))
    .filter((part) => part.text !== '')
}

export type ExerciseContext = {
  /** 1-based position in the session */
  n: number
  total: number
  /** "8 ismétlés" */
  dose: string
  /** "kb. 2 perc"; only for rep doses, a time dose already states its duration */
  duration?: string
  /** "Új a héten" or growth such as "+5 mp" */
  badge?: string
  prevId?: string
  nextId?: string
}

/** Where the exercise sits in the session; undefined when the session does not contain it. */
export function buildExerciseContext(
  exercise: Exercise,
  session: ProgramSession,
  program: readonly ProgramSession[],
  exercises: readonly Exercise[],
  flags?: PrescriptionFlags,
): ExerciseContext | undefined {
  const items = sessionItems(session)
  const index = items.findIndex((i) => i.exerciseId === exercise.id)
  const item = items[index]
  if (!item) return undefined
  const rows = buildOverview(
    session,
    previousSameSlot(program, session),
    exercises,
    flags,
  ).blocks.flatMap((b) => b.rows)
  const badge = rows[index]?.badge
  return {
    n: index + 1,
    total: items.length,
    dose: doseLabel(item.dose, exercise.repUnit),
    duration:
      item.dose.kind === 'reps'
        ? `kb. ${Math.max(1, Math.round(item.estSeconds / 60))} perc`
        : undefined,
    badge: badge === 'Új' ? 'Új a héten' : badge,
    prevId: items[index - 1]?.exerciseId,
    nextId: items[index + 1]?.exerciseId,
  }
}

/**
 * "Te legutóbb" text from the most recent finished session that included the exercise,
 * or undefined when there is none. Logs only keep per-exercise completion, easier use and
 * best hold, so the dose is the one prescribed in that session.
 */
export function lastTimeText(
  exercise: Exercise,
  logs: readonly SessionLog[],
  program: readonly ProgramSession[],
): string | undefined {
  const last = logs
    .filter((l) => l.completed.includes(exercise.id))
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0]
  if (!last) return undefined
  const session = program.find((s) => s.id === last.sessionId)
  const item = session && sessionItems(session).find((i) => i.exerciseId === exercise.id)
  const parts: string[] = []
  if (item) parts.push(doseLabel(item.dose, exercise.repUnit))
  const hold = last.bestHoldSec?.[exercise.id]
  if (hold) parts.push(`legjobb tartás ${hold} mp`)
  if (last.usedEasier.includes(exercise.id)) parts.push('könnyítéssel')
  const head = session ? `${session.week}. hét: ` : ''
  return parts.length > 0 ? `${head}${parts.join(', ')}.` : `${head}elvégezted.`
}
