import { describe, expect, it } from 'vitest'
import { exercises } from '../../src/content/exercises'
import { getSession } from '../../src/content/program'
import { buildOverview, difficulty, doseGrowth } from '../../src/domain/sessionOverview'
import type { SessionItem } from '../../src/domain/types'

const item = (dose: SessionItem['dose']): SessionItem => ({ exerciseId: 'x', dose, estSeconds: 0 })

describe('difficulty', () => {
  it.each([
    [1, 1],
    [3, 2],
    [5, 3],
    [8, 4],
    [12, 5],
  ])('week %i -> %i', (week, expected) => expect(difficulty(week)).toBe(expected))
})

describe('doseGrowth', () => {
  it('reports growth only', () => {
    expect(
      doseGrowth(
        item({ kind: 'time', seconds: 35, sets: 3 }),
        item({ kind: 'time', seconds: 30, sets: 3 }),
      ),
    ).toBe('+5 mp')
    expect(doseGrowth(item({ kind: 'reps', reps: 9 }), item({ kind: 'reps', reps: 8 }))).toBe(
      '+1 ism.',
    )
    expect(
      doseGrowth(item({ kind: 'reps', reps: 8 }), item({ kind: 'reps', reps: 8 })),
    ).toBeUndefined()
    expect(
      doseGrowth(item({ kind: 'reps', reps: 8 }), item({ kind: 'time', seconds: 8 })),
    ).toBeUndefined()
  })
})

describe('buildOverview w03-b', () => {
  const session = getSession('w03-b')!
  const previous = getSession('w02-b')
  const o = buildOverview(session, previous, exercises)
  const rows = o.blocks.flatMap((b) => b.rows)

  it('summarises the session like the design', () => {
    expect(o.kicker).toBe('3. hét · B edzés')
    expect(o.title).toBe('Core & gerinc')
    expect(o.minutes).toBe('50 perc')
    expect(o.exerciseCount).toBe(rows.length)
    expect(o.difficulty).toBe(2)
    expect(o.blocks.map((b) => b.short)).toEqual(["8'", "34'", "8'"])
  })

  it('numbers rows across blocks and formats doses', () => {
    expect(rows.map((r) => r.n)).toEqual(rows.map((_, i) => i + 1))
    const by = (hu: string) => rows.find((r) => r.nameHu === hu)
    expect(by('Százas')?.dose).toBe('100 számolás')
    expect(by('Egylábas körzés')?.dose).toBe('5 / irány')
    expect(by('Sellő nyújtás + gyermekpóz')?.dose).toBe('8 perc')
    expect(by('Pilates-légzés')?.dose).toBe('2 perc')
  })

  it('badges new exercises and week-over-week growth', () => {
    expect(rows.find((r) => r.nameHu === 'Felgördülés')?.badge).toBe('Új')
    expect(rows.find((r) => r.nameHu === 'Alkartámasz')?.badge).toBe('+5 mp')
    expect(rows.find((r) => r.nameHu === 'Százas')?.badge).toBeUndefined()
  })
})
