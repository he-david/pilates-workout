import { describe, expect, it } from 'vitest'
import { getExercise } from '../../src/content/exercises'
import { assessmentDescription, getSession, phases, program } from '../../src/content/program'
import type { Dose, ProgramSession } from '../../src/domain/types'

const items = (s: ProgramSession) => [...s.warmup, ...s.main, ...s.cooldown]
const sum = (xs: { estSeconds: number }[]) => xs.reduce((a, x) => a + x.estSeconds, 0)
const ADVANCED = ['teaser', 'rollover', 'corkscrew', 'push-up', 'leg-pull-front']
const PROPS = ['ball', 'ring', 'band', 'weights']

describe('program structure', () => {
  it('has exactly 36 sessions, 3 per week, slots A/B/C in order', () => {
    expect(program).toHaveLength(36)
    for (let week = 1; week <= 12; week++) {
      const w = program.filter((s) => s.week === week)
      expect(w.map((s) => s.slot)).toEqual(['A', 'B', 'C'])
    }
  })

  it('has unique ids like w03-b and getSession finds them', () => {
    const ids = program.map((s) => s.id)
    expect(new Set(ids).size).toBe(36)
    for (const s of program) {
      expect(s.id).toBe(`w${String(s.week).padStart(2, '0')}-${s.slot.toLowerCase()}`)
      expect(getSession(s.id)).toBe(s)
    }
    expect(getSession('nope')).toBeUndefined()
  })

  it('maps weeks to phases 1-4 / 5-8 / 9-12 and matches phase info', () => {
    for (const s of program) {
      expect(s.phase).toBe(s.week <= 4 ? 1 : s.week <= 8 ? 2 : 3)
      const info = phases.find((p) => p.phase === s.phase)
      expect(s.week).toBeGreaterThanOrEqual(info?.fromWeek ?? 99)
      expect(s.week).toBeLessThanOrEqual(info?.toWeek ?? 0)
    }
    expect(phases.map((p) => p.title)).toEqual(['Alapozás', 'Építés', 'Kihívás'])
    expect(assessmentDescription).toBe('Plank-teszt, roll up ismétlésszám')
  })

  it('flags assessment on weeks 4, 8, 12 only', () => {
    for (const s of program) expect(!!s.isAssessment).toBe([4, 8, 12].includes(s.week))
  })

  it('every exerciseId exists in the library', () => {
    for (const s of program)
      for (const i of items(s)) expect(getExercise(i.exerciseId), i.exerciseId).toBeDefined()
    for (const p of phases) for (const id of p.highlights) expect(getExercise(id), id).toBeDefined()
  })
})

describe('time budget', () => {
  it.each(program.map((s) => [s.id, s] as const))('%s fits 50 min (8 / 34 / 8)', (_id, s) => {
    const w = sum(s.warmup) / 60
    const m = sum(s.main) / 60
    const c = sum(s.cooldown) / 60
    expect(w).toBeGreaterThanOrEqual(7)
    expect(w).toBeLessThanOrEqual(9)
    expect(m).toBeGreaterThanOrEqual(32)
    expect(m).toBeLessThanOrEqual(36)
    expect(c).toBeGreaterThanOrEqual(7)
    expect(c).toBeLessThanOrEqual(9)
    expect(w + m + c).toBeGreaterThanOrEqual(48)
    expect(w + m + c).toBeLessThanOrEqual(52)
    expect(s.main.length).toBeGreaterThanOrEqual(8)
    expect(s.main.length).toBeLessThanOrEqual(11)
    for (const i of items(s)) expect(i.estSeconds).toBeGreaterThanOrEqual(30)
  })
})

describe('week 3 B matches design 03', () => {
  const s = getSession('w03-b')
  const name = (id: string) => getExercise(id)?.nameHu
  it('has the exact order, doses and new flags', () => {
    expect(s?.title).toBe('Core & gerinc')
    expect(s?.warmup.map((i) => [i.exerciseId, i.dose])).toEqual([
      ['lateral-breathing', { kind: 'time', seconds: 120 }],
      ['pelvic-curl', { kind: 'reps', reps: 10 }],
      ['cat-cow', { kind: 'reps', reps: 8 }],
      ['supine-spine-twist', { kind: 'reps', reps: 8, perSide: true }],
    ])
    expect(s?.main.map((i) => [i.exerciseId, i.dose])).toEqual([
      ['hundred', { kind: 'reps', reps: 100 }],
      ['roll-up', { kind: 'reps', reps: 8 }],
      ['single-leg-circles', { kind: 'reps', reps: 5, perSide: true }],
      ['rolling-like-a-ball', { kind: 'reps', reps: 8 }],
      ['single-leg-stretch', { kind: 'reps', reps: 10, perSide: true }],
      ['double-leg-stretch', { kind: 'reps', reps: 8 }],
      ['spine-stretch-forward', { kind: 'reps', reps: 6 }],
      ['swan', { kind: 'reps', reps: 6 }],
      ['forearm-plank', { kind: 'time', seconds: 35, sets: 3 }],
    ])
    expect(s?.cooldown.map((i) => [name(i.exerciseId), i.dose])).toEqual([
      ['Sellő nyújtás + gyermekpóz', { kind: 'time', seconds: 480 }],
    ])
    expect(s && items(s)).toHaveLength(14)
    expect(
      s &&
        items(s)
          .filter((i) => i.isNew)
          .map((i) => i.exerciseId),
    ).toEqual(['roll-up'])
    expect(s && [sum(s.warmup), sum(s.main), sum(s.cooldown)]).toEqual([480, 2040, 480])
  })

  it('plank grew 5 s from week 2', () => {
    const plank = (id: string) =>
      getSession(id)?.main.find((i) => i.exerciseId === 'forearm-plank')?.dose
    expect(plank('w02-b')).toEqual({ kind: 'time', seconds: 30, sets: 3 })
  })
})

describe('progression is gradual', () => {
  const amount = (d: Dose) => (d.kind === 'reps' ? d.reps : d.seconds)
  const byExercise = new Map<string, { week: number; dose: Dose }[]>()
  for (const s of program)
    for (const i of [...s.warmup, ...s.main])
      byExercise.set(`${s.slot}:${i.exerciseId}`, [
        ...(byExercise.get(`${s.slot}:${i.exerciseId}`) ?? []),
        { week: s.week, dose: i.dose },
      ])

  it('doses never drop and rise by at most 2 reps / 5 s per week (hundred counts: 25)', () => {
    for (const [key, list] of byExercise) {
      const limit = key.includes('hundred') ? 25 : 2
      list.forEach((cur, idx) => {
        const prev = list[idx - 1]
        if (!prev || cur.week !== prev.week + 1) return
        const diff = amount(cur.dose) - amount(prev.dose)
        expect(diff, key).toBeGreaterThanOrEqual(0)
        expect(diff, key).toBeLessThanOrEqual(cur.dose.kind === 'time' ? 5 : limit)
      })
    }
  })

  it('assessment weeks repeat the previous dose (no jump on test weeks)', () => {
    for (const list of byExercise.values())
      for (const cur of list) {
        if (![4, 8, 12].includes(cur.week)) continue
        const prev = list.find((x) => x.week === cur.week - 1)
        if (prev) expect(cur.dose).toEqual(prev.dose)
      }
  })

  it('introduces equipment and advanced work only in the right phase', () => {
    for (const s of program)
      for (const i of items(s)) {
        const ex = getExercise(i.exerciseId)
        if (s.phase === 1)
          expect(
            ex?.equipment.every((e) => !PROPS.includes(e)),
            i.exerciseId,
          ).toBe(true)
        if (s.phase < 3) expect(ADVANCED, i.exerciseId).not.toContain(i.exerciseId)
      }
  })

  it('advanced exercises start with few reps and stay capped', () => {
    for (const s of program)
      for (const i of s.main)
        if (ADVANCED.includes(i.exerciseId) && i.dose.kind === 'reps') {
          expect(i.dose.reps).toBeLessThanOrEqual(8)
        }
    const first = (id: string) => program.find((s) => s.main.some((i) => i.exerciseId === id))
    for (const id of ['teaser', 'rollover', 'corkscrew']) {
      const d = first(id)?.main.find((i) => i.exerciseId === id)?.dose
      expect(d && d.kind === 'reps' ? d.reps : 99, id).toBeLessThanOrEqual(3)
    }
  })

  it('roll-up first appears in week 3 B', () => {
    const first = program.find((s) => items(s).some((i) => i.exerciseId === 'roll-up'))
    expect(first?.id).toBe('w03-b')
  })
})
