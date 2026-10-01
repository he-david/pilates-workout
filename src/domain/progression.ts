import type {
  Dose,
  Prescription,
  ProgramSession,
  ProgressionRule,
  SessionItem,
  SessionLog,
} from './types'

/** Adaptive progression: tweaks only the next session from the ratings in the logs. */

const BUMP_REPS = 1
const BUMP_SECONDS = 5
const HOLD_FACTOR = 0.8
const HOLD_STEP = 5
const HOLD_FLOOR = 15
/** Safety ceilings: a bump never pushes a dose past these (counted exercises like the Hundred are left alone). */
const MAX_REPS = 30
const MAX_SECONDS = 180
const HARDER_SWAPS = 2

/** Program week from a session id such as "w03-b"; undefined for unknown ids. */
export function weekOfSessionId(sessionId: string): number | undefined {
  const m = /^w(\d{2})-/.exec(sessionId)
  return m ? Number(m[1]) : undefined
}

function latest(history: readonly SessionLog[]): SessionLog | undefined {
  return history.reduce<SessionLog | undefined>(
    (best, l) => (!best || l.finishedAt > best.finishedAt ? l : best),
    undefined,
  )
}

function bumpDose(dose: Dose): Dose {
  if (dose.kind === 'time') {
    return dose.seconds >= MAX_SECONDS
      ? dose
      : { ...dose, seconds: Math.min(MAX_SECONDS, dose.seconds + BUMP_SECONDS) }
  }
  return dose.reps >= MAX_REPS ? dose : { ...dose, reps: dose.reps + BUMP_REPS }
}

function shortenHold(dose: Dose): Dose {
  if (dose.kind !== 'time') return dose
  const cut = Math.round((dose.seconds * HOLD_FACTOR) / HOLD_STEP) * HOLD_STEP
  return {
    ...dose,
    seconds: Math.max(Math.min(HOLD_FLOOR, dose.seconds), Math.min(dose.seconds, cut)),
  }
}

function sameDose(a: Dose, b: Dose): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function doseUnits(d: Dose): number {
  return d.kind === 'time' ? d.seconds : d.reps
}

function withDose(item: SessionItem, dose: Dose): SessionItem {
  if (sameDose(item.dose, dose)) return item
  const ratio = doseUnits(dose) / doseUnits(item.dose)
  return { ...item, dose, estSeconds: Math.round(item.estSeconds * ratio) }
}

function mapMain(session: ProgramSession, fn: (item: SessionItem) => SessionItem): ProgramSession {
  return { ...session, main: session.main.map(fn) }
}

function changedIds(before: ProgramSession, after: ProgramSession): string[] {
  return after.main
    .filter((it, i) => {
      const was = before.main[i]
      return was !== undefined && !sameDose(it.dose, was.dose)
    })
    .map((i) => i.exerciseId)
}

const none = (session: ProgramSession): Prescription => ({
  session,
  rule: 'none',
  modified: [],
  easierPreselected: [],
  harderSwapped: [],
  notes: [],
})

/**
 * Applies the rule for the latest log's rating to `session` (the next session).
 * `history` is every saved log; `previous` is the same slot one week earlier, used by the
 * hold rule. Assessment sessions are never modified, so their numbers stay comparable.
 */
export function prescribe(
  session: ProgramSession,
  history: readonly SessionLog[],
  previous?: ProgramSession,
): Prescription {
  const last = latest(history)
  if (!last || session.isAssessment) return none(session)

  let rule: ProgressionRule = 'none'
  let next = session
  let easier: string[] = []
  let harder: string[] = []
  let note = ''

  switch (last.rating) {
    case 1:
      rule = 'bump'
      next = mapMain(session, (it) => withDose(it, bumpDose(it.dose)))
      note = 'Az előző edzés nagyon könnyű volt, ezért kicsit emeltük az adagokat.'
      break
    case 2: {
      const week = weekOfSessionId(last.sessionId)
      const easyThisWeek = history.filter(
        (l) => l.rating === 2 && week !== undefined && weekOfSessionId(l.sessionId) === week,
      ).length
      if (easyThisWeek >= 2) {
        rule = 'pullForward'
        harder = session.main
          .filter((i) => !i.isNew)
          .slice(0, HARDER_SWAPS)
          .map((i) => i.exerciseId)
        note =
          'Ezen a héten kétszer is könnyű volt, ezért nehezebb változatot kapsz két gyakorlatból.'
      }
      break
    }
    case 4:
      easier = session.main.filter((i) => i.isNew).map((i) => i.exerciseId)
      if (easier.length > 0) {
        rule = 'offerEasier'
        note = 'Az előző edzés nehéz volt, az új gyakorlatoknál a könnyebb változat van kijelölve.'
      }
      break
    case 5: {
      rule = 'hold'
      const prevById = new Map((previous ? previous.main : []).map((i) => [i.exerciseId, i]))
      next = mapMain(session, (it) => {
        const before = prevById.get(it.exerciseId)
        const held =
          before && before.dose.kind === it.dose.kind && doseUnits(before.dose) < doseUnits(it.dose)
            ? withDose(it, before.dose)
            : it
        return withDose(held, shortenHold(held.dose))
      })
      note = 'Az előző edzés túl nehéz volt: az adagok maradtak, a tartások 20%-kal rövidebbek.'
      break
    }
    default:
      break
  }

  const modified = changedIds(session, next)
  if (modified.length === 0 && easier.length === 0 && harder.length === 0) return none(session)
  return {
    session: next,
    rule,
    modified,
    easierPreselected: easier,
    harderSwapped: harder,
    notes: [note],
  }
}
