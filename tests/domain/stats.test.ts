import { describe, expect, it } from 'vitest'
import {
  assessmentRecords,
  calendarCells,
  calendarWindow,
  computeStats,
  rangeTitle,
  ratingTrend,
  ratingWeeks,
  totalSeconds,
} from '../../src/domain/stats'
import type { ProgramSession, Rating, SessionLog } from '../../src/domain/types'

const mk = (id: string, week: number, isAssessment = false): ProgramSession => ({
  id,
  week,
  slot: 'A',
  phase: 1,
  title: id,
  ...(isAssessment ? { isAssessment } : {}),
  warmup: [],
  main: [],
  cooldown: [],
})
const program = [mk('s1', 1), mk('s2', 2), mk('s3', 3), mk('s4', 4, true), mk('s8', 8, true)]
const log = (
  sessionId: string,
  day: string,
  rating: Rating = 3,
  extra: Partial<SessionLog> = {},
): SessionLog => ({
  sessionId,
  startedAt: new Date(`${day}T17:00:00`).toISOString(),
  finishedAt: new Date(`${day}T18:00:00`).toISOString(),
  durationSec: 3000,
  completed: [],
  usedEasier: [],
  rating,
  areas: [],
  ...extra,
})
const settings = { trainingDays: [1, 4, 6], startDate: '2026-10-05' }

describe('totals', () => {
  it('sums durations', () => {
    expect(totalSeconds([log('s1', '2026-10-05'), log('s2', '2026-10-08')])).toBe(6000)
    expect(totalSeconds([])).toBe(0)
  })
  it('computeStats bundles label, progress, streak', () => {
    const logs = [log('s1', '2026-10-05'), log('s2', '2026-10-08')]
    const s = computeStats(settings, logs, program, new Date('2026-10-08T20:00:00'))
    expect(s).toMatchObject({ streak: 2, totalLabel: '1 ó 40 p', done: 2, total: 5 })
  })
})

describe('calendarCells', () => {
  // Mon 2026-10-05 .. Sun 2026-10-18, today Thu 10-08
  const logs = [log('s1', '2026-10-05')]
  const cells = calendarCells(
    settings,
    logs,
    program,
    new Date(2026, 9, 5),
    new Date(2026, 9, 18),
    new Date(2026, 9, 8),
  )
  const status = (d: number) => cells.find((c) => c?.day === d)?.status
  it('has Monday-first full weeks', () => {
    expect(cells).toHaveLength(14)
    expect(cells[0]?.day).toBe(5)
  })
  it('marks done, today, planned, none', () => {
    expect(status(5)).toBe('done')
    expect(status(8)).toBe('today')
    expect(status(10)).toBe('planned')
    expect(status(12)).toBe('planned')
    expect(status(6)).toBe('none')
  })
  it('pads leading and trailing blanks', () => {
    const c = calendarCells(
      settings,
      [],
      program,
      new Date(2026, 9, 7),
      new Date(2026, 9, 14),
      new Date(2026, 9, 7),
    )
    expect(c.slice(0, 2)).toEqual([null, null])
    expect(c).toHaveLength(14)
    expect(c[c.length - 1]).toBeNull()
  })
  it('marks missed past training days after the start date only', () => {
    const c = calendarCells(
      { ...settings, startDate: '2026-10-06' },
      [],
      program,
      new Date(2026, 9, 5),
      new Date(2026, 9, 11),
      new Date(2026, 9, 10),
    )
    const st = (d: number) => c.find((x) => x?.day === d)?.status
    expect(st(5)).toBe('none')
    expect(st(8)).toBe('missed')
    expect(st(10)).toBe('today')
  })
  it('caps planned days to the remaining sessions', () => {
    const c = calendarCells(
      settings,
      program.slice(0, 4).map((s) => log(s.id, '2026-10-05')),
      program,
      new Date(2026, 9, 5),
      new Date(2026, 9, 25),
      new Date(2026, 9, 8),
    )
    expect(c.filter((x) => x?.status === 'planned')).toHaveLength(1)
  })
})

describe('rangeTitle', () => {
  it.each([
    [new Date(2026, 8, 14), new Date(2026, 9, 11), 'Szeptember – október'],
    [new Date(2026, 9, 1), new Date(2026, 9, 31), 'Október'],
  ])('%s', (a, b, out) => expect(rangeTitle(a, b)).toBe(out))
})

describe('ratingWeeks and trend', () => {
  it('groups by program week', () => {
    const w = ratingWeeks(
      [log('s2', '2026-10-08', 4), log('s1', '2026-10-05', 2), log('s1', '2026-10-06', 3)],
      program,
    )
    expect(w).toEqual([
      { week: 1, label: '1. hét', ratings: [2, 3] },
      { week: 2, label: '2. hét', ratings: [4] },
    ])
  })
  const wk = (week: number, ...ratings: Rating[]) => ({ week, label: `${week}. hét`, ratings })
  it.each([
    ['few', [wk(1, 3, 3)]],
    ['stable', [wk(1, 3, 3), wk(2, 2, 3, 3)]],
    ['easier', [wk(1, 4, 4), wk(2, 4), wk(3, 2, 2), wk(4, 2)]],
    ['harder', [wk(1, 2, 2), wk(2, 2), wk(3, 4, 4), wk(4, 3, 4)]],
    ['easier', [wk(1, 1, 2, 2)]],
    ['harder', [wk(1, 4, 5, 4)]],
  ] as const)('%s', (kind, weeks) => {
    expect(ratingTrend(weeks).kind).toBe(kind)
    expect(ratingTrend(weeks).text.length).toBeGreaterThan(0)
  })
})

describe('assessmentRecords', () => {
  it('is empty without assessment data', () => {
    expect(
      assessmentRecords(
        [log('s1', '2026-10-05', 3, { bestHoldSec: { 'forearm-plank': 20 } })],
        program,
      ),
    ).toEqual([])
  })
  it('compares first and latest assessment', () => {
    const logs = [
      log('s8', '2026-11-30', 3, {
        bestHoldSec: { 'forearm-plank': 40 },
        bestReps: { 'roll-up': 8 },
      }),
      log('s4', '2026-11-02', 3, { bestHoldSec: { 'forearm-plank': 25 }, usedEasier: ['roll-up'] }),
    ]
    expect(assessmentRecords(logs, program)).toEqual([
      { name: 'Alkartámasz', en: 'Forearm Plank', from: '25 mp', to: '40 mp' },
      { name: 'Felgördülés', en: 'Roll Up', from: 'könnyítve', to: '8 tiszta ism.' },
    ])
  })
  it('shows clean reps baseline when measured', () => {
    const logs = [
      log('s4', '2026-11-02', 3, { bestReps: { 'roll-up': 3 } }),
      log('s8', '2026-11-30', 3, { bestReps: { 'roll-up': 8 } }),
    ]
    expect(assessmentRecords(logs, program)[0]).toMatchObject({
      from: '3 tiszta ism.',
      to: '8 tiszta ism.',
    })
  })
})

describe('calendarWindow', () => {
  it.each([
    ['Thursday', new Date(2026, 9, 1), '2026-09-14', '2026-10-11'],
    ['Monday', new Date(2026, 9, 5), '2026-09-21', '2026-10-18'],
    ['Sunday', new Date(2026, 9, 11), '2026-09-21', '2026-10-18'],
  ])('%s', (_n, today, from, to) => {
    const w = calendarWindow(today)
    const key = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expect([key(w.from), key(w.to)]).toEqual([from, to])
    expect(w.from.getDay()).toBe(1)
  })
})
