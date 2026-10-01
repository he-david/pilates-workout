import { buildWeekRows, phaseState, weekdayLetters } from '../../src/domain/programView'
import type { ProgramSession, SessionLog } from '../../src/domain/types'

function s(week: number, slot: 'A' | 'B' | 'C', isAssessment = false): ProgramSession {
  const id = `w${String(week).padStart(2, '0')}-${slot.toLowerCase()}`
  return {
    id,
    week,
    slot,
    phase: week <= 4 ? 1 : 2,
    title: id,
    ...(isAssessment ? { isAssessment } : {}),
    warmup: [],
    main: [],
    cooldown: [],
  }
}
const prog = [1, 2, 3, 4, 5].flatMap((w) => [
  s(w, 'A', w === 4),
  s(w, 'B', w === 4),
  s(w, 'C', w === 4),
])
function log(sessionId: string): SessionLog {
  return {
    sessionId,
    startedAt: '',
    finishedAt: '',
    durationSec: 0,
    completed: [],
    usedEasier: [],
    rating: 3,
    areas: [],
  }
}
const logs = prog.slice(0, 7).map((p) => log(p.id))

describe('buildWeekRows', () => {
  it('groups by week with status and counts', () => {
    const rows = buildWeekRows(prog, logs)
    expect(rows).toHaveLength(5)
    expect(rows.map((r) => r.status)).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming'])
    expect(rows[2]).toMatchObject({ week: 3, phase: 1, doneCount: 1, total: 3 })
    expect(rows[3]?.isAssessment).toBe(true)
    expect(rows[0]?.sessions).toHaveLength(3)
  })

  it('marks everything done when complete', () => {
    const rows = buildWeekRows(
      prog,
      prog.map((p) => log(p.id)),
    )
    expect(rows.every((r) => r.status === 'done')).toBe(true)
  })

  it('first week is current with no logs', () => {
    expect(buildWeekRows(prog, [])[0]?.status).toBe('current')
  })
})

describe('phaseState', () => {
  it.each([
    [1, 1, false, 'current'],
    [2, 1, false, 'locked'],
    [1, 2, false, 'done'],
    [3, 3, true, 'done'],
  ] as const)('phase %i, current %i, complete %s -> %s', (phase, current, complete, expected) => {
    expect(phaseState(phase, current, complete)).toBe(expected)
  })
})

describe('weekdayLetters', () => {
  it('lists training days Monday first', () => {
    expect(weekdayLetters([6, 1, 4])).toEqual(['H', 'Cs', 'Szo'])
    expect(weekdayLetters([0, 3])).toEqual(['Sze', 'V'])
  })
})
