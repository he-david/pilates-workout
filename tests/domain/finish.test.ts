import {
  AREA_OPTIONS,
  buildLog,
  parseMeasure,
  RATING_OPTIONS,
  streakWithPending,
} from '../../src/domain/finish'
import type { FinishSummary } from '../../src/domain/player'

const summary: FinishSummary = {
  sessionId: 'w01-a',
  startedAt: Date.UTC(2026, 9, 1, 8, 0, 0),
  finishedAt: Date.UTC(2026, 9, 1, 8, 50, 0),
  durationSec: 3000,
  completed: ['x', 'y'],
  usedEasier: ['y'],
}

describe('buildLog', () => {
  it('maps summary and form, ordering areas canonically', () => {
    const log = buildLog(summary, { rating: 4, areas: ['Váll', 'Has'], note: '  jó volt ' })
    expect(log).toEqual({
      sessionId: 'w01-a',
      startedAt: '2026-10-01T08:00:00.000Z',
      finishedAt: '2026-10-01T08:50:00.000Z',
      durationSec: 3000,
      completed: ['x', 'y'],
      usedEasier: ['y'],
      rating: 4,
      areas: ['Has', 'Váll'],
      note: 'jó volt',
    })
  })
  it('omits a blank note', () => {
    expect('note' in buildLog(summary, { rating: 3, areas: [], note: '   ' })).toBe(false)
  })
})

describe('streakWithPending', () => {
  it('counts the pending session', () => {
    const today = new Date(2026, 9, 1, 12) // Thursday
    const pending = buildLog(
      { ...summary, finishedAt: today.getTime(), startedAt: today.getTime() - 3000_000 },
      { rating: 3, areas: [], note: '' },
    )
    expect(streakWithPending({ trainingDays: [4] }, [], pending, today)).toBe(1)
  })
})

describe('options', () => {
  it('has 5 ratings and 6 areas', () => {
    expect(RATING_OPTIONS.map((r) => r.value)).toEqual([1, 2, 3, 4, 5])
    expect(AREA_OPTIONS).toHaveLength(6)
  })
})

describe('exerciseCount', () => {
  it('counts distinct exercises', async () => {
    const { getSession } = await import('../../src/content/program')
    const { exerciseCount } = await import('../../src/domain/finish')
    const s = getSession('w01-a')
    if (!s) throw new Error('missing')
    expect(exerciseCount(s)).toBeGreaterThan(5)
  })
})

describe('assessment measures', () => {
  it.each([
    ['42', 600, 42],
    [' 7 ', 100, 7],
    ['', 100, undefined],
    ['0', 100, undefined],
    ['-3', 100, undefined],
    ['4.5', 100, undefined],
    ['abc', 100, undefined],
    ['101', 100, undefined],
    [undefined, 100, undefined],
  ])('parseMeasure(%j, %i)', (text, max, want) => {
    expect(parseMeasure(text, max)).toBe(want)
  })

  it('stores valid plank hold and roll up reps in the log', () => {
    const log = buildLog(summary, {
      rating: 3,
      areas: [],
      note: '',
      plankSec: '40',
      rollUpReps: '8',
    })
    expect(log.bestHoldSec).toEqual({ 'forearm-plank': 40 })
    expect(log.bestReps).toEqual({ 'roll-up': 8 })
  })
  it('omits blank or invalid measures', () => {
    const log = buildLog(summary, {
      rating: 3,
      areas: [],
      note: '',
      plankSec: '',
      rollUpReps: 'x',
    })
    expect('bestHoldSec' in log).toBe(false)
    expect('bestReps' in log).toBe(false)
  })
})
