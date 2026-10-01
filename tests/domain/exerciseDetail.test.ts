import { exercises, getExercise } from '../../src/content/exercises'
import { getSession, program } from '../../src/content/program'
import { buildExerciseContext, lastTimeText, parseStep } from '../../src/domain/exerciseDetail'
import { sessionItems } from '../../src/domain/todaySummary'
import type { SessionLog } from '../../src/domain/types'

describe('parseStep', () => {
  it.each([
    ['Egyszerű lépés.', [{ text: 'Egyszerű lépés.', bold: false }]],
    [
      'Kilégzés: gördülj fel.',
      [
        { text: 'Kilégzés:', bold: true },
        { text: ' gördülj fel.', bold: false },
      ],
    ],
    [
      'Hanyatt. Belégzés: karok fel.',
      [
        { text: 'Hanyatt. ', bold: false },
        { text: 'Belégzés:', bold: true },
        { text: ' karok fel.', bold: false },
      ],
    ],
    [
      'Belégzés, majd kilégzés: vissza.',
      [
        { text: 'Belégzés, majd kilégzés:', bold: true },
        { text: ' vissza.', bold: false },
      ],
    ],
    [
      'Belégzés: fel. Kilégzés: le.',
      [
        { text: 'Belégzés:', bold: true },
        { text: ' fel. ', bold: false },
        { text: 'Kilégzés:', bold: true },
        { text: ' le.', bold: false },
      ],
    ],
  ])('%s', (input, expected) => {
    expect(parseStep(input)).toEqual(expected)
  })
})

describe('buildExerciseContext', () => {
  const session = getSession('w03-b')!
  it('gives position, dose, badge and neighbours', () => {
    const hundred = getExercise('hundred')!
    const ctx = buildExerciseContext(hundred, session, program, exercises)!
    expect(ctx.n).toBeGreaterThan(0)
    expect(ctx.dose).toBe('100 számolás')
    expect(ctx.duration).toMatch(/^kb\. \d+ perc$/)
    expect(ctx.total).toBe(session.warmup.length + session.main.length + session.cooldown.length)
  })
  it('shows the duration only for rep doses', () => {
    const timed = program
      .flatMap((s) => sessionItems(s).map((i) => ({ s, i })))
      .find(({ i }) => i.dose.kind === 'time')!
    const ex = getExercise(timed.i.exerciseId)!
    expect(buildExerciseContext(ex, timed.s, program, exercises)!.duration).toBeUndefined()
  })
  it('maps "Új" to "Új a héten" and has no prev at the start', () => {
    const first = session.warmup[0]!.exerciseId
    const ctx = buildExerciseContext(getExercise(first)!, session, program, exercises)!
    expect(ctx.n).toBe(1)
    expect(ctx.prevId).toBeUndefined()
    expect(ctx.nextId).toBeDefined()
  })
  it('is undefined when the session lacks the exercise', () => {
    const other = exercises.find(
      (e) =>
        ![...session.warmup, ...session.main, ...session.cooldown].some(
          (i) => i.exerciseId === e.id,
        ),
    )!
    expect(buildExerciseContext(other, session, program, exercises)).toBeUndefined()
  })
})

describe('lastTimeText', () => {
  const ex = getExercise('hundred')!
  const log = (over: Partial<SessionLog>): SessionLog => ({
    sessionId: 'w03-b',
    startedAt: '2026-01-01T10:00:00Z',
    finishedAt: '2026-01-01T11:00:00Z',
    durationSec: 3000,
    completed: ['hundred'],
    usedEasier: [],
    rating: 3,
    areas: [],
    ...over,
  })
  it('is undefined without matching logs', () => {
    expect(lastTimeText(ex, [], program)).toBeUndefined()
    expect(lastTimeText(ex, [log({ completed: [] })], program)).toBeUndefined()
  })
  it('uses the latest log and mentions easier use and best hold', () => {
    const text = lastTimeText(
      ex,
      [
        log({ sessionId: 'w01-b', finishedAt: '2025-12-01T00:00:00Z' }),
        log({ usedEasier: ['hundred'], bestHoldSec: { hundred: 40 } }),
      ],
      program,
    )
    expect(text).toMatch(/^3\. hét: 100 számolás, legjobb tartás 40 mp, könnyítéssel\.$/)
  })
})
