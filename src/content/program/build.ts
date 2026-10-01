import type { Dose, Phase, ProgramSession, SessionItem, SessionSlot } from '../../domain/types'

export const WEEKS = 12
export const ASSESSMENT_WEEKS: readonly number[] = [4, 8, 12]

/** Block budgets in seconds: 8 / 34 / 8 minutes = 50 minutes. */
export const WARMUP_SEC = 480
export const MAIN_SEC = 2040
export const COOLDOWN_SEC = 480

type Range = { from: number; until: number }

/** Rep-based exercise: base reps in week `from`, +step per week, capped. */
export type RepSpec = Range & {
  id: string
  kind: 'reps'
  base: number
  step: number
  max: number
  perSide?: boolean
}

/** Hold-based exercise: base seconds in week `from`, +step s per week, capped. */
export type HoldSpec = Range & {
  id: string
  kind: 'time'
  base: number
  step: number
  max: number
  sets?: number
}

export type Spec = RepSpec | HoldSpec

export const reps = (
  id: string,
  from: number,
  until: number,
  base: number,
  step: number,
  max: number,
  perSide = false,
): RepSpec => ({ id, kind: 'reps', from, until, base, step, max, ...(perSide ? { perSide } : {}) })

export const hold = (
  id: string,
  from: number,
  until: number,
  base: number,
  step: number,
  max: number,
  sets?: number,
): HoldSpec => ({ id, kind: 'time', from, until, base, step, max, ...(sets ? { sets } : {}) })

export function phaseOf(week: number): Phase {
  return week <= 4 ? 1 : week <= 8 ? 2 : 3
}

/** Progress steps since the exercise was introduced. Assessment weeks repeat the previous dose. */
function stepsDone(spec: Range, week: number): number {
  const assessmentsPassed = ASSESSMENT_WEEKS.filter((a) => a > spec.from && a <= week).length
  return Math.max(0, week - spec.from - assessmentsPassed)
}

export function doseAt(spec: Spec, week: number): Dose {
  const value = Math.min(spec.max, spec.base + spec.step * stepsDone(spec, week))
  if (spec.kind === 'reps') {
    return spec.perSide
      ? { kind: 'reps', reps: value, perSide: true }
      : { kind: 'reps', reps: value }
  }
  return spec.sets
    ? { kind: 'time', seconds: value, sets: spec.sets }
    : { kind: 'time', seconds: value }
}

/** Rough effort of a dose in seconds, used only to split a block's time budget. */
function workSeconds(id: string, dose: Dose): number {
  if (dose.kind === 'time') return dose.seconds * (dose.sets ?? 1)
  if (id === 'hundred' || id === 'ball-hundred') return dose.reps
  return dose.reps * (dose.perSide ? 2 : 1) * 5
}

/** Split `targetSec` over items by weight; every share is a multiple of 5 s and the sum is exact. */
export function allocate(target: number, weights: readonly number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0)
  const shares = weights.map((w) => Math.max(30, Math.round((target * w) / total / 5) * 5))
  const diff = target - shares.reduce((a, b) => a + b, 0)
  let largest = 0
  shares.forEach((s, i) => {
    if (s > (shares[largest] ?? 0)) largest = i
  })
  shares[largest] = (shares[largest] ?? 0) + diff
  return shares
}

type Pending = { exerciseId: string; dose: Dose }

function pendingFor(specs: readonly Spec[], week: number): Pending[] {
  return specs
    .filter((s) => week >= s.from && week < s.until)
    .map((s) => ({ exerciseId: s.id, dose: doseAt(s, week) }))
}

function toItems(
  pending: Pending[],
  target: number,
  phase: Phase,
  seen: Set<string>,
): SessionItem[] {
  const overhead = phase === 3 ? 45 : 60
  const est = allocate(
    target,
    pending.map((p) => workSeconds(p.exerciseId, p.dose) + overhead),
  )
  return pending.map((p, i) => {
    const isNew = !seen.has(p.exerciseId)
    seen.add(p.exerciseId)
    return {
      exerciseId: p.exerciseId,
      dose: p.dose,
      estSeconds: est[i] ?? 0,
      ...(isNew ? { isNew } : {}),
    }
  })
}

export type SlotPlan = {
  slot: SessionSlot
  title: string
  warmup: readonly Spec[]
  main: readonly Spec[]
  cooldown: readonly Spec[]
}

/** Builds all sessions in play order (week, then A/B/C). `isNew` marks the first appearance. */
export function buildProgram(plans: readonly SlotPlan[]): ProgramSession[] {
  const seen = new Set<string>()
  const sessions: ProgramSession[] = []
  for (let week = 1; week <= WEEKS; week++) {
    const phase = phaseOf(week)
    for (const plan of plans) {
      const warmup = toItems(pendingFor(plan.warmup, week), WARMUP_SEC, phase, seen)
      const main = toItems(pendingFor(plan.main, week), MAIN_SEC, phase, seen)
      const cooldown = toItems(pendingFor(plan.cooldown, week), COOLDOWN_SEC, phase, seen)
      sessions.push({
        id: `w${String(week).padStart(2, '0')}-${plan.slot.toLowerCase()}`,
        week,
        slot: plan.slot,
        phase,
        title: plan.title,
        ...(ASSESSMENT_WEEKS.includes(week) ? { isAssessment: true } : {}),
        warmup,
        main,
        cooldown,
      })
    }
  }
  return sessions
}
