import { describe, expect, it } from 'vitest'
import { prescribe, weekOfSessionId } from '../../src/domain/progression'
import type { Dose, ProgramSession, Rating, SessionItem, SessionLog } from '../../src/domain/types'

const item = (exerciseId: string, dose: Dose, isNew = false): SessionItem => ({
  exerciseId,
  dose,
  estSeconds: 100,
  ...(isNew ? { isNew } : {}),
})

const mk = (week: number, over: Partial<ProgramSession> = {}): ProgramSession => ({
  id: `w${String(week).padStart(2, '0')}-a`,
  week,
  slot: 'A',
  phase: 1,
  title: 't',
  warmup: [item('wu', { kind: 'reps', reps: 8 })],
  main: [
    item('roll', { kind: 'reps', reps: 8 }),
    item('plank', { kind: 'time', seconds: 40, sets: 3 }),
    item('hundred', { kind: 'reps', reps: 100 }, true),
    item('bridge', { kind: 'reps', reps: 10 }, true),
  ],
  cooldown: [],
  ...over,
})

let n = 0
const log = (sessionId: string, rating: Rating): SessionLog => {
  n += 1
  return {
    sessionId,
    startedAt: `2026-01-01T10:${String(n).padStart(2, '0')}:00Z`,
    finishedAt: `2026-01-01T11:${String(n).padStart(2, '0')}:00Z`,
    durationSec: 3000,
    completed: [],
    usedEasier: [],
    rating,
    areas: [],
  }
}

const next = mk(3)
const dose = (s: ProgramSession, id: string) => s.main.find((i) => i.exerciseId === id)?.dose

describe('prescribe', () => {
  it('no history: as written', () => {
    const p = prescribe(next, [])
    expect(p.rule).toBe('none')
    expect(p.session).toBe(next)
    expect(p.notes).toEqual([])
  })

  it('rating 1: +1 rep / +5 s on every main item, one step only', () => {
    const p = prescribe(next, [log('w02-c', 1)])
    expect(p.rule).toBe('bump')
    expect(dose(p.session, 'roll')).toEqual({ kind: 'reps', reps: 9 })
    expect(dose(p.session, 'plank')).toEqual({ kind: 'time', seconds: 45, sets: 3 })
    expect(p.modified).toEqual(['roll', 'plank', 'bridge'])
    expect(p.session.warmup).toEqual(next.warmup)
    expect(p.session.main[0]?.estSeconds).toBeGreaterThan(100)
  })

  it('rating 1 respects the ceilings', () => {
    const s = mk(3, {
      main: [item('a', { kind: 'reps', reps: 30 }), item('b', { kind: 'time', seconds: 180 })],
    })
    const p = prescribe(s, [log('w02-c', 1)])
    expect(p.rule).toBe('none')
    expect(p.session).toBe(s)
  })

  it('rating 2 once in a week: nothing', () => {
    expect(prescribe(next, [log('w02-b', 2)]).rule).toBe('none')
  })

  it('rating 2 twice in one week: harder variant on 2 non-new main exercises', () => {
    const p = prescribe(next, [log('w02-a', 2), log('w02-b', 2)])
    expect(p.rule).toBe('pullForward')
    expect(p.harderSwapped).toEqual(['roll', 'plank'])
    expect(p.modified).toEqual([])
  })

  it('rating 2 twice in different weeks: nothing', () => {
    expect(prescribe(next, [log('w01-c', 2), log('w02-a', 2)]).rule).toBe('none')
  })

  it('rating 3: as written', () => {
    expect(prescribe(next, [log('w02-c', 3)]).rule).toBe('none')
  })

  it('rating 4: easier preselected on new items only', () => {
    const p = prescribe(next, [log('w02-c', 4)])
    expect(p.rule).toBe('offerEasier')
    expect(p.easierPreselected).toEqual(['hundred', 'bridge'])
    expect(p.session).toBe(next)
  })

  it('rating 4 with no new items: nothing', () => {
    const s = mk(3, { main: [item('a', { kind: 'reps', reps: 8 })] })
    expect(prescribe(s, [log('w02-c', 4)]).rule).toBe('none')
  })

  it('rating 5: previous doses kept and holds -20% in 5 s steps', () => {
    const prev = mk(2, {
      main: [
        item('roll', { kind: 'reps', reps: 7 }),
        item('plank', { kind: 'time', seconds: 35, sets: 3 }),
      ],
    })
    const p = prescribe(next, [log('w02-c', 5)], prev)
    expect(p.rule).toBe('hold')
    expect(dose(p.session, 'roll')).toEqual({ kind: 'reps', reps: 7 })
    expect(dose(p.session, 'plank')).toEqual({ kind: 'time', seconds: 30, sets: 3 })
    expect(dose(p.session, 'hundred')).toEqual({ kind: 'reps', reps: 100 })
    expect(p.modified).toContain('plank')
  })

  it('rating 5 without previous: holds -20% only, floor 15 s', () => {
    const s = mk(3, {
      main: [item('p', { kind: 'time', seconds: 40 }), item('q', { kind: 'time', seconds: 15 })],
    })
    const p = prescribe(s, [log('w02-c', 5)])
    expect(dose(p.session, 'p')).toEqual({ kind: 'time', seconds: 30 })
    expect(dose(p.session, 'q')).toEqual({ kind: 'time', seconds: 15 })
  })

  it('assessment sessions are never modified', () => {
    const s = mk(4, { isAssessment: true })
    for (const r of [1, 2, 4, 5] as const) {
      expect(prescribe(s, [log('w03-a', r), log('w03-b', r)]).session).toBe(s)
    }
  })

  it('uses the most recent log by finish time, regardless of array order', () => {
    const b = log('w02-b', 3)
    const a = log('w02-a', 1)
    a.finishedAt = '2026-02-01T00:00:00Z'
    expect(prescribe(next, [b, a]).rule).toBe('bump')
    expect(prescribe(next, [a, b]).rule).toBe('bump')
  })

  it('is deterministic and does not mutate input', () => {
    const snap = JSON.stringify(next)
    const h = [log('w02-c', 5)]
    expect(prescribe(next, h)).toEqual(prescribe(next, h))
    expect(JSON.stringify(next)).toBe(snap)
  })
})

describe('weekOfSessionId', () => {
  it('parses ids', () => {
    expect(weekOfSessionId('w03-b')).toBe(3)
    expect(weekOfSessionId('nope')).toBeUndefined()
  })
})
