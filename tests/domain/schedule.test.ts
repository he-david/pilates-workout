import { describe, expect, it } from 'vitest'
import {
  currentStreak,
  lastLogOf,
  nextSession,
  programProgress,
  sessionStatus,
  weekView,
} from '../../src/domain/schedule'
import type { ProgramSession, SessionLog } from '../../src/domain/types'

const mk = (id: string, week: number, phase: 1 | 2 | 3): ProgramSession => ({
  id,
  week,
  slot: 'A',
  phase,
  title: id,
  warmup: [],
  main: [],
  cooldown: [],
})
const program = [mk('w01-a', 1, 1), mk('w01-b', 1, 1), mk('w01-c', 1, 1), mk('w05-a', 5, 2)]
const settings = { trainingDays: [1, 4, 6] }

// local-time dates: 2026-10-05 is a Monday
const at = (d: string, h = 18) => new Date(`${d}T${pad(h)}:00:00`)
const pad = (n: number) => String(n).padStart(2, '0')
const log = (sessionId: string, day: string): SessionLog => ({
  sessionId,
  startedAt: at(day, 17).toISOString(),
  finishedAt: at(day, 18).toISOString(),
  durationSec: 3000,
  completed: [],
  usedEasier: [],
  rating: 3,
  areas: [],
})

describe('nextSession / sessionStatus', () => {
  it.each([
    [[], 'w01-a'],
    [['w01-a'], 'w01-b'],
    [['w01-a', 'w01-b', 'w01-c'], 'w05-a'],
    [['w01-b'], 'w01-a'], // first without a log, regardless of order
  ])('logs %j -> %s', (ids, expected) => {
    const logs = ids.map((id) => log(id, '2026-10-01'))
    expect(nextSession(program, logs)?.id).toBe(expected)
  })

  it('is undefined when complete', () => {
    const logs = program.map((s) => log(s.id, '2026-10-01'))
    expect(nextSession(program, logs)).toBeUndefined()
  })

  it('ignores duplicate logs and classifies sessions', () => {
    const logs = [log('w01-a', '2026-10-01'), log('w01-a', '2026-10-02')]
    expect(sessionStatus(program[0]!, program, logs)).toBe('done')
    expect(sessionStatus(program[1]!, program, logs)).toBe('next')
    expect(sessionStatus(program[2]!, program, logs)).toBe('upcoming')
  })
})

describe('programProgress', () => {
  it('empty logs', () => {
    expect(programProgress(program, [])).toMatchObject({
      done: 0,
      total: 4,
      percent: 0,
      complete: false,
      currentWeek: 1,
      currentPhase: 1,
    })
  })
  it('mid-program moves week/phase', () => {
    const logs = ['w01-a', 'w01-b', 'w01-c'].map((id) => log(id, '2026-10-01'))
    const p = programProgress(program, logs)
    expect(p).toMatchObject({ done: 3, percent: 75, currentWeek: 5, currentPhase: 2 })
    expect(p.next?.id).toBe('w05-a')
  })
  it('complete stays on last session', () => {
    const logs = program.map((s) => log(s.id, '2026-10-01'))
    expect(programProgress(program, logs)).toMatchObject({
      done: 4,
      percent: 100,
      complete: true,
      currentWeek: 5,
      currentPhase: 2,
      next: undefined,
    })
  })
  it('rounds percent and handles empty program', () => {
    expect(programProgress(program, [log('w01-a', '2026-10-01')]).percent).toBe(25)
    expect(programProgress([], [])).toMatchObject({ total: 0, percent: 0, complete: false })
  })
})

describe('weekView', () => {
  it('Thursday: Mon done, Thu today, Sat planned, rest days', () => {
    const w = weekView(settings, [log('w01-a', '2026-10-05')], at('2026-10-08'))
    expect(w.days.map((d) => d.date)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ])
    expect(w.days.map((d) => d.status)).toEqual([
      'done',
      'rest',
      'rest',
      'today',
      'rest',
      'planned',
      'rest',
    ])
    expect(w.doneCount).toBe(1)
    expect(w.plannedCount).toBe(3)
    expect(w.days[3]?.isToday).toBe(true)
  })
  it('Sunday belongs to the week ending that day; missed past day', () => {
    const w = weekView(settings, [log('w01-b', '2026-10-08')], at('2026-10-11'))
    expect(w.days[0]?.date).toBe('2026-10-05')
    expect(w.days.map((d) => d.status)).toEqual([
      'missed',
      'rest',
      'rest',
      'done',
      'rest',
      'missed',
      'today',
    ])
  })
  it('done wins on today; extra session on a rest day is done but not counted', () => {
    const w = weekView(
      settings,
      [log('w01-a', '2026-10-08'), log('w01-b', '2026-10-06')],
      at('2026-10-08', 20),
    )
    expect(w.days[3]?.status).toBe('done')
    expect(w.days[1]?.status).toBe('done')
    expect(w.doneCount).toBe(1)
  })
  it('uses local day of a late-evening log', () => {
    const l = {
      ...log('w01-a', '2026-10-05'),
      finishedAt: new Date(2026, 9, 5, 23, 50).toISOString(),
    }
    expect(weekView(settings, [l], at('2026-10-06')).days[0]?.status).toBe('done')
  })
  it('spans the DST change (2026-10-25) without shifting days', () => {
    const w = weekView(settings, [], at('2026-10-27'))
    expect(w.days.map((d) => d.date)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
    expect(w.days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })
  it('custom training days', () => {
    const w = weekView({ trainingDays: [2] }, [], at('2026-10-05'))
    expect(w.plannedCount).toBe(1)
    expect(w.days[1]?.status).toBe('planned')
  })
})

describe('currentStreak', () => {
  const s = settings
  it('no logs -> 0', () => expect(currentStreak(s, [], at('2026-10-08'))).toBe(0))
  it('no training days -> 0', () =>
    expect(currentStreak({ trainingDays: [] }, [log('a', '2026-10-05')], at('2026-10-08'))).toBe(0))
  it('open training day today does not break', () => {
    const logs = [log('a', '2026-10-03'), log('b', '2026-10-05')]
    expect(currentStreak(s, logs, at('2026-10-08'))).toBe(2)
  })
  it('today done counts', () => {
    const logs = [log('a', '2026-10-05'), log('b', '2026-10-08')]
    expect(currentStreak(s, logs, at('2026-10-08'))).toBe(2)
  })
  it('rest days do not break', () => {
    expect(currentStreak(s, [log('a', '2026-10-05')], at('2026-10-07'))).toBe(1)
  })
  it('missed past training day breaks', () => {
    // Mon 10-05 done, Thu 10-08 missed, Sat 10-10 done, today Sun
    const logs = [log('a', '2026-10-05'), log('b', '2026-10-10')]
    expect(currentStreak(s, logs, at('2026-10-11'))).toBe(1)
  })
  it('missed yesterday-style training day gives 0', () => {
    expect(currentStreak(s, [log('a', '2026-10-05')], at('2026-10-09'))).toBe(0)
  })
  it('non-training-day session neither adds nor breaks', () => {
    const logs = [log('a', '2026-10-05'), log('b', '2026-10-07'), log('c', '2026-10-08')]
    expect(currentStreak(s, logs, at('2026-10-08'))).toBe(2)
  })
  it('does not count days before the first log', () => {
    const logs = [log('a', '2026-10-08')]
    expect(currentStreak(s, logs, at('2026-10-08'))).toBe(1)
  })
  it('long run across DST change', () => {
    const days = ['2026-10-22', '2026-10-24', '2026-10-26', '2026-10-29', '2026-10-31']
    const logs = days.map((d, i) => log(`s${i}`, d))
    expect(currentStreak(s, logs, at('2026-11-01'))).toBe(5)
  })
})

describe('lastLogOf', () => {
  const l = (sessionId: string, day: string): SessionLog => ({
    sessionId,
    startedAt: `${day}T10:00:00.000Z`,
    finishedAt: `${day}T11:00:00.000Z`,
    durationSec: 3000,
    completed: [],
    usedEasier: [],
    rating: 3,
    areas: [],
  })
  it('returns undefined without a log', () => {
    expect(lastLogOf('a', [l('b', '2026-10-01')])).toBeUndefined()
  })
  it('picks the latest of repeated logs', () => {
    const logs = [l('a', '2026-10-05'), l('a', '2026-10-01'), l('b', '2026-10-09')]
    expect(lastLogOf('a', logs)?.finishedAt).toBe('2026-10-05T11:00:00.000Z')
  })
})
