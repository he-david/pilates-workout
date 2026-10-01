import type {
  Equipment,
  Exercise,
  ProgramSession,
  SessionItem,
  SessionLog,
  SessionSlot,
} from './types'

/** Pure helpers behind the Today hero and phase card. */

const SLOT_NUMBER: Record<SessionSlot, number> = { A: 1, B: 2, C: 3 }
const EQUIPMENT_ORDER: readonly Equipment[] = ['mat', 'ball', 'ring', 'band', 'weights']
const EQUIPMENT_LABEL: Record<Equipment, string> = {
  mat: 'Matrac',
  ball: 'kis labda',
  ring: 'Pilates-gyűrű',
  band: 'gumiszalag',
  weights: 'súlyzó',
}
const MAX_LISTED = 2

export function sessionItems(session: ProgramSession): SessionItem[] {
  return [...session.warmup, ...session.main, ...session.cooldown]
}

export function sessionSeconds(session: ProgramSession): number {
  return sessionItems(session).reduce((sum, item) => sum + item.estSeconds, 0)
}

/** Position of the session inside its program week: A = 1, B = 2, C = 3. */
export function slotNumber(session: ProgramSession): number {
  return SLOT_NUMBER[session.slot]
}

/** Equipment the session needs, in a fixed order (mat first). */
export function sessionEquipment(
  session: ProgramSession,
  exercises: readonly Exercise[],
): Equipment[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const used = new Set<Equipment>()
  for (const item of sessionItems(session)) {
    for (const eq of byId.get(item.exerciseId)?.equipment ?? []) used.add(eq)
  }
  return EQUIPMENT_ORDER.filter((e) => used.has(e))
}

/** "Matrac + kis labda" */
export function equipmentLabel(equipment: readonly Equipment[]): string {
  return equipment.map((e) => EQUIPMENT_LABEL[e]).join(' + ')
}

/** Same slot one week earlier, if it exists. */
export function previousSameSlot(
  program: readonly ProgramSession[],
  session: ProgramSession,
): ProgramSession | undefined {
  return program.find((s) => s.slot === session.slot && s.week === session.week - 1)
}

function doseDiff(now: SessionItem, before: SessionItem): string | undefined {
  if (now.dose.kind === 'time' && before.dose.kind === 'time') {
    const d = now.dose.seconds - before.dose.seconds
    return d > 0 ? `+${d} mp` : undefined
  }
  if (now.dose.kind === 'reps' && before.dose.kind === 'reps') {
    const d = now.dose.reps - before.dose.reps
    return d > 0 ? `+${d} ismétlés` : undefined
  }
  return undefined
}

function limited(parts: string[]): string {
  const shown = parts.slice(0, MAX_LISTED).join(', ')
  return parts.length > MAX_LISTED ? `${shown} +${parts.length - MAX_LISTED} további` : shown
}

/**
 * Hero sub-text: new exercises plus dose increases versus the same slot last week.
 * "Új a héten: Felgördülés. Hosszabb: Alkartámasz +5 mp."
 */
export function whatsNewText(
  session: ProgramSession,
  previous: ProgramSession | undefined,
  nameOf: (exerciseId: string) => string,
): string {
  const items = sessionItems(session)
  const added = items.filter((i) => i.isNew).map((i) => nameOf(i.exerciseId))
  const before = new Map((previous ? sessionItems(previous) : []).map((i) => [i.exerciseId, i]))
  const grown: string[] = []
  for (const item of items) {
    const prev = before.get(item.exerciseId)
    const diff = prev && doseDiff(item, prev)
    if (diff) grown.push(`${nameOf(item.exerciseId)} ${diff}`)
  }
  const sentences: string[] = []
  if (added.length > 0) sentences.push(`Új a héten: ${limited(added)}.`)
  if (grown.length > 0) sentences.push(`Több: ${limited(grown)}.`)
  if (sentences.length > 0) return sentences.join(' ')
  return previous ? 'Ugyanaz a felépítés, mint a múlt héten.' : 'Ismerkedés a mozdulatokkal.'
}

/** Per program week: share (0..1) of its sessions that have a log. Index 0 = week 1. */
export function weekFractions(
  program: readonly ProgramSession[],
  logs: readonly SessionLog[],
  weeks: number,
): number[] {
  const done = new Set(logs.map((l) => l.sessionId))
  return Array.from({ length: weeks }, (_, i) => {
    const inWeek = program.filter((s) => s.week === i + 1)
    return inWeek.length === 0 ? 0 : inWeek.filter((s) => done.has(s.id)).length / inWeek.length
  })
}

/** Hint under the phase bars: next assessment week inside the phase, else the phase blurb. */
export function phaseHint(
  currentWeek: number,
  phase: { phase: number; fromWeek: number; toWeek: number; description: string },
  assessmentWeeks: readonly number[],
): string {
  const week = assessmentWeeks.find(
    (w) => w >= currentWeek && w >= phase.fromWeek && w <= phase.toWeek,
  )
  if (week === undefined) return phase.description
  const base = `A ${week}. hét felmérő hét: ugyanazok a gyakorlatok, hogy lásd, mennyit fejlődtél.`
  return phase.phase === 1 ? `${base} Utána jönnek a kis eszközök.` : base
}
