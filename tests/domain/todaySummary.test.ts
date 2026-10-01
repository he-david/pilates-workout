import { describe, expect, it } from 'vitest'
import {
  equipmentLabel,
  phaseHint,
  previousSameSlot,
  sessionEquipment,
  sessionSeconds,
  slotNumber,
  weekFractions,
  whatsNewText,
} from '../../src/domain/todaySummary'
import type { Exercise, ProgramSession, SessionItem, SessionLog } from '../../src/domain/types'

const item = (
  exerciseId: string,
  dose: SessionItem['dose'],
  isNew = false,
  estSeconds = 60,
): SessionItem => ({ exerciseId, dose, estSeconds, ...(isNew ? { isNew } : {}) })

const mk = (
  id: string,
  week: number,
  slot: 'A' | 'B' | 'C',
  main: SessionItem[],
): ProgramSession => ({
  id,
  week,
  slot,
  phase: 1,
  title: id,
  warmup: [],
  main,
  cooldown: [],
})

const names: Record<string, string> = { plank: 'Alkartámasz', roll: 'Felgördülés', a: 'A', b: 'B' }
const nameOf = (id: string) => names[id] ?? id

describe('whatsNewText', () => {
  const prev = mk('w02-b', 2, 'B', [item('plank', { kind: 'time', seconds: 20 })])
  it.each([
    [
      'new exercise and longer hold',
      [item('roll', { kind: 'reps', reps: 5 }, true), item('plank', { kind: 'time', seconds: 25 })],
      prev,
      'Új a héten: Felgördülés. Több: Alkartámasz +5 mp.',
    ],
    [
      'rep increase',
      [item('plank', { kind: 'reps', reps: 8 })],
      mk('x', 2, 'B', [item('plank', { kind: 'reps', reps: 7 })]),
      'Több: Alkartámasz +1 ismétlés.',
    ],
    [
      'nothing changed',
      [item('plank', { kind: 'time', seconds: 20 })],
      prev,
      'Ugyanaz a felépítés, mint a múlt héten.',
    ],
    [
      'first week, no previous, only new',
      [item('roll', { kind: 'reps', reps: 5 }, true)],
      undefined,
      'Új a héten: Felgördülés.',
    ],
    [
      'first week with nothing new',
      [item('roll', { kind: 'reps', reps: 5 })],
      undefined,
      'Ismerkedés a mozdulatokkal.',
    ],
    [
      'many new items are truncated',
      ['a', 'b', 'c', 'd', 'e'].map((id) => item(id, { kind: 'reps', reps: 5 }, true)),
      undefined,
      'Új a héten: A, B +3 további.',
    ],
    [
      'decrease is not reported',
      [item('plank', { kind: 'time', seconds: 10 })],
      prev,
      'Ugyanaz a felépítés, mint a múlt héten.',
    ],
  ])('%s', (_name, main, previous, expected) => {
    expect(whatsNewText(mk('w03-b', 3, 'B', main), previous, nameOf)).toBe(expected)
  })
})

describe('session helpers', () => {
  it('slotNumber maps A/B/C to 1/2/3', () => {
    expect(['A', 'B', 'C'].map((s) => slotNumber(mk('x', 1, s as 'A', [])))).toEqual([1, 2, 3])
  })

  it('sessionSeconds sums all blocks', () => {
    const s = { ...mk('x', 1, 'A', [item('a', { kind: 'reps', reps: 1 }, false, 100)]) }
    s.warmup = [item('b', { kind: 'reps', reps: 1 }, false, 50)]
    expect(sessionSeconds(s)).toBe(150)
  })

  it('previousSameSlot finds last week same slot', () => {
    const p = [mk('w01-b', 1, 'B', []), mk('w02-a', 2, 'A', []), mk('w02-b', 2, 'B', [])]
    expect(previousSameSlot(p, p[2] as ProgramSession)?.id).toBe('w01-b')
    expect(previousSameSlot(p, p[0] as ProgramSession)).toBeUndefined()
  })

  it('equipment is unique and ordered, mat first', () => {
    const ex = (id: string, equipment: Exercise['equipment']) => ({ id, equipment }) as Exercise
    const s = mk('x', 1, 'A', [
      item('p', { kind: 'reps', reps: 1 }),
      item('q', { kind: 'reps', reps: 1 }),
      item('r', { kind: 'reps', reps: 1 }),
    ])
    const eq = sessionEquipment(s, [ex('p', ['ball']), ex('q', ['mat']), ex('r', ['mat', 'band'])])
    expect(eq).toEqual(['mat', 'ball', 'band'])
    expect(equipmentLabel(eq)).toBe('Matrac + kis labda + gumiszalag')
    expect(equipmentLabel(['mat'])).toBe('Matrac')
  })
})

describe('weekFractions', () => {
  it('computes the done share per week', () => {
    const p = [
      mk('w01-a', 1, 'A', []),
      mk('w01-b', 1, 'B', []),
      mk('w02-a', 2, 'A', []),
      mk('w02-b', 2, 'B', []),
    ]
    const logs = ['w01-a', 'w01-b', 'w02-a'].map((sessionId) => ({ sessionId }) as SessionLog)
    expect(weekFractions(p, logs, 3)).toEqual([1, 0.5, 0])
  })
})

describe('phaseHint', () => {
  const phase1 = { phase: 1, fromWeek: 1, toWeek: 4, description: 'desc' }
  const phase2 = { phase: 2, fromWeek: 5, toWeek: 8, description: 'desc2' }
  it.each([
    [3, phase1, 'A 4. hét felmérő hét'],
    [4, phase1, 'Utána jönnek a kis eszközök.'],
    [6, phase2, 'A 8. hét felmérő hét'],
  ])('week %i', (week, phase, part) => {
    expect(phaseHint(week, phase, [4, 8, 12])).toContain(part)
  })
  it('falls back to the description after the last assessment', () => {
    expect(phaseHint(12, { ...phase2, fromWeek: 9, toWeek: 11 }, [4, 8, 12])).toBe('desc2')
  })
})
