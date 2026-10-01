import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../src/data/db'
import { clearSnapshot, loadSnapshot, saveSnapshot } from '../../src/data/player'
import { getSettings, initSettings, saveSettings } from '../../src/data/settings'
import { requestPersistence } from '../../src/platform/storage'
import type { PlayerSnapshot, SessionLog } from '../../src/domain/types'

const snap = (index: number): PlayerSnapshot => ({
  sessionId: 'w01-a',
  index,
  at: 'step',
  endsAt: 1000,
  doneSteps: [0],
  usedEasier: [],
  elapsedMs: 5,
})

beforeEach(async () => {
  await Promise.all([db.logs.clear(), db.settings.clear(), db.player.clear()])
})

describe('settings', () => {
  it('is undefined before init', async () => {
    expect(await getSettings()).toBeUndefined()
  })
  it('initSettings writes defaults once and is idempotent', async () => {
    const first = await initSettings(new Date(2026, 9, 1))
    expect(first).toMatchObject({
      id: 'me',
      startDate: '2026-10-01',
      trainingDays: [1, 4, 6],
      reminderTime: '18:30',
    })
    const second = await initSettings(new Date(2027, 0, 5))
    expect(second.startDate).toBe('2026-10-01')
    expect(await db.settings.count()).toBe(1)
  })
  it('saveSettings overwrites', async () => {
    await initSettings(new Date(2026, 9, 1))
    await saveSettings({ id: 'me', startDate: '2026-11-02', trainingDays: [2, 5] })
    expect((await getSettings())?.trainingDays).toEqual([2, 5])
  })
})

describe('player snapshot', () => {
  it('returns undefined when empty', async () => {
    expect(await loadSnapshot()).toBeUndefined()
  })
  it('saves, replaces the single snapshot, and clears', async () => {
    await saveSnapshot(snap(1))
    await saveSnapshot(snap(4))
    expect(await db.player.count()).toBe(1)
    expect(await loadSnapshot()).toEqual(snap(4))
    await clearSnapshot()
    expect(await loadSnapshot()).toBeUndefined()
  })
})

describe('logs schema', () => {
  it('indexes by sessionId and finishedAt', async () => {
    const log = (sessionId: string, finishedAt: string): SessionLog => ({
      sessionId,
      startedAt: finishedAt,
      finishedAt,
      durationSec: 60,
      completed: [],
      usedEasier: [],
      rating: 3,
      areas: [],
    })
    await db.logs.bulkAdd([log('w01-b', '2026-10-02'), log('w01-a', '2026-10-01')])
    expect((await db.logs.where('sessionId').equals('w01-a').toArray()).length).toBe(1)
    expect((await db.logs.orderBy('finishedAt').toArray())[0]?.sessionId).toBe('w01-a')
  })
})

describe('requestPersistence', () => {
  it('returns false without throwing when unsupported', async () => {
    expect(await requestPersistence()).toBe(false)
  })
  it('returns the browser answer and swallows errors', async () => {
    Object.defineProperty(navigator, 'storage', {
      value: { persist: async () => true },
      configurable: true,
    })
    expect(await requestPersistence()).toBe(true)
    Object.defineProperty(navigator, 'storage', {
      value: {
        persist: async () => {
          throw new Error('x')
        },
      },
      configurable: true,
    })
    expect(await requestPersistence()).toBe(false)
    Object.defineProperty(navigator, 'storage', { value: undefined, configurable: true })
  })
})
