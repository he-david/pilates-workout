import { db } from '../../src/data/db'
import { listLogs, saveLog } from '../../src/data/logs'
import type { SessionLog } from '../../src/domain/types'

const base: SessionLog = {
  sessionId: 'w01-a',
  startedAt: '2026-10-01T16:00:00.000Z',
  finishedAt: '2026-10-01T16:50:00.000Z',
  durationSec: 3000,
  completed: ['a'],
  usedEasier: [],
  rating: 4,
  areas: [],
}

describe('logs store', () => {
  beforeEach(() => db.logs.clear())

  it('saves and lists logs oldest first', async () => {
    const later = { ...base, sessionId: 'w01-b', finishedAt: '2026-10-03T16:50:00.000Z' }
    await saveLog(later)
    const id = await saveLog(base)
    expect(typeof id).toBe('number')
    const all = await listLogs()
    expect(all.map((l) => l.sessionId)).toEqual(['w01-a', 'w01-b'])
    expect(all[0]?.id).toBe(id)
  })

  it.each([
    ['empty sessionId', { sessionId: '' }],
    ['bad date', { finishedAt: 'nope' }],
    ['negative duration', { durationSec: -1 }],
    ['rating out of range', { rating: 9 as SessionLog['rating'] }],
  ])('rejects %s', async (_name, patch) => {
    await expect(saveLog({ ...base, ...patch })).rejects.toThrow()
    expect(await db.logs.count()).toBe(0)
  })
})
