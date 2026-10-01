import { doseShort, minutesLabel, minutesShort } from './format'
import { sessionEquipment, equipmentLabel, sessionItems, sessionSeconds } from './todaySummary'
import type { Exercise, ProgramSession, SessionItem } from './types'

/** Pure view model for the session overview screen. */

export type OverviewBlockKey = 'warmup' | 'main' | 'cooldown'

export type OverviewRow = {
  /** 1-based position across the whole session */
  n: number
  exerciseId: string
  nameHu: string
  nameEn: string
  dose: string
  /** "Új" or a growth versus last week such as "+5 mp" */
  badge?: string
}

export type OverviewBlock = {
  key: OverviewBlockKey
  title: string
  seconds: number
  /** "8'" */
  short: string
  rows: OverviewRow[]
}

export type SessionOverview = {
  kicker: string
  title: string
  minutes: string
  exerciseCount: number
  difficulty: number
  equipment: string
  blocks: OverviewBlock[]
}

const MAX_DIFFICULTY = 5
const PROGRAM_WEEKS = 12
const BLOCKS: readonly { key: OverviewBlockKey; title: string }[] = [
  { key: 'warmup', title: 'Bemelegítés' },
  { key: 'main', title: 'Fő rész' },
  { key: 'cooldown', title: 'Levezetés' },
]

/** 1..5 growing with the program week (week 3 -> 2, week 12 -> 5). */
export function difficulty(week: number): number {
  const level = Math.ceil((week / PROGRAM_WEEKS) * MAX_DIFFICULTY)
  return Math.min(MAX_DIFFICULTY, Math.max(1, level))
}

/** "+5 mp" / "+1 ism." when the dose grew versus last week's same exercise, else undefined. */
export function doseGrowth(now: SessionItem, before: SessionItem): string | undefined {
  if (now.dose.kind === 'time' && before.dose.kind === 'time') {
    const d = now.dose.seconds - before.dose.seconds
    return d > 0 ? `+${d} mp` : undefined
  }
  if (now.dose.kind === 'reps' && before.dose.kind === 'reps') {
    const d = now.dose.reps - before.dose.reps
    return d > 0 ? `+${d} ism.` : undefined
  }
  return undefined
}

/** Pumping counts (the Hundred) never get a growth badge: the design shows none. */
export function buildOverview(
  session: ProgramSession,
  previous: ProgramSession | undefined,
  exercises: readonly Exercise[],
): SessionOverview {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const before = new Map((previous ? sessionItems(previous) : []).map((i) => [i.exerciseId, i]))
  let n = 0
  const blocks = BLOCKS.map(({ key, title }): OverviewBlock => {
    const items = session[key]
    const rows = items.map((item): OverviewRow => {
      const ex = byId.get(item.exerciseId)
      const prev = before.get(item.exerciseId)
      n += 1
      return {
        n,
        exerciseId: item.exerciseId,
        nameHu: ex?.nameHu ?? item.exerciseId,
        nameEn: ex?.nameEn ?? '',
        dose: doseShort(item.dose, ex?.repUnit),
        badge: item.isNew
          ? 'Új'
          : prev && ex?.repUnit !== 'count'
            ? doseGrowth(item, prev)
            : undefined,
      }
    })
    const seconds = items.reduce((sum, i) => sum + i.estSeconds, 0)
    return { key, title, seconds, short: minutesShort(seconds), rows }
  })
  return {
    kicker: `${session.week}. hét · ${session.slot} edzés`,
    title: session.title,
    minutes: minutesLabel(sessionSeconds(session)),
    exerciseCount: n,
    difficulty: difficulty(session.week),
    equipment: equipmentLabel(sessionEquipment(session, exercises)),
    blocks,
  }
}
