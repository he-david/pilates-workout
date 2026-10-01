import { vi } from 'vitest'
import { exportBackup, importBackup } from '../../src/data/backup'
import { db, PLAYER_KEY } from '../../src/data/db'
import { listLogs, saveLog } from '../../src/data/logs'
import type { SessionLog, Settings } from '../../src/domain/types'
import * as share from '../../src/platform/share'

const settings: Settings = { id: 'me', startDate: '2026-09-21', trainingDays: [1, 4, 6] }
const mk = (sessionId: string): SessionLog => ({
  sessionId,
  startedAt: '2026-10-01T16:00:00.000Z',
  finishedAt: `2026-10-0${sessionId.slice(-1)}T16:50:00.000Z`,
  durationSec: 3000,
  completed: ['a'],
  usedEasier: [],
  rating: 4,
  areas: ['core'],
  note: 'jó',
  bestHoldSec: { plank: 30 },
})
const now = new Date(2026, 9, 5, 12)

async function reset() {
  await db.logs.clear()
  await db.settings.clear()
  await db.player.clear()
}

describe('backup export / import', () => {
  beforeEach(reset)
  afterEach(() => vi.restoreAllMocks())

  it('round-trips logs and settings through a file', async () => {
    await db.settings.put(settings)
    await saveLog(mk('w01-1'))
    await saveLog(mk('w01-2'))
    let text = ''
    vi.spyOn(share, 'shareFile').mockImplementation(async (f) => {
      text = await f.text()
      expect(f.name).toBe('tonus-backup-2026-10-05.json')
      return 'shared'
    })
    expect(await exportBackup(now)).toBe(true)
    const exported = (await db.settings.get('me'))?.lastBackupAt
    expect(exported).toBe(now.toISOString())
    const before = (await listLogs()).map((l) => ({ ...l, id: undefined }))

    await reset()
    await db.player.put({ sessionId: 'x' } as never, PLAYER_KEY)
    expect(await importBackup(text)).toEqual({ ok: true, count: 2 })
    expect((await listLogs()).map((l) => ({ ...l, id: undefined }))).toEqual(before)
    expect(await db.settings.get('me')).toEqual({ ...settings, lastBackupAt: now.toISOString() })
    expect(await db.player.count()).toBe(0)
  })

  it('does not record a backup when the share is cancelled', async () => {
    await db.settings.put(settings)
    vi.spyOn(share, 'shareFile').mockResolvedValue('cancelled')
    expect(await exportBackup(now)).toBe(false)
    expect((await db.settings.get('me'))?.lastBackupAt).toBeUndefined()
  })

  it('leaves data untouched when the file is invalid', async () => {
    await saveLog(mk('w01-1'))
    const r = await importBackup('{"app":"nope"}')
    expect(r.ok).toBe(false)
    expect(await db.logs.count()).toBe(1)
  })
})
