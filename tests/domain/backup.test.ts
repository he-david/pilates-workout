import { backupFilename, buildBackup, needsBackupNudge, parseBackup } from '../../src/domain/backup'
import type { SessionLog, Settings } from '../../src/domain/types'

const settings: Settings = { id: 'me', startDate: '2026-09-21', trainingDays: [1, 4, 6] }
const log: SessionLog = {
  sessionId: 'w01-a',
  startedAt: '2026-10-01T16:00:00.000Z',
  finishedAt: '2026-10-01T16:50:00.000Z',
  durationSec: 3000,
  completed: ['a'],
  usedEasier: [],
  rating: 4,
  areas: [],
}
const now = new Date(2026, 9, 1, 12)
const valid = () => JSON.parse(JSON.stringify(buildBackup(settings, [{ ...log, id: 7 }], now)))
const parse = (v: unknown) => parseBackup(JSON.stringify(v))

describe('backup format', () => {
  it('names the file by local date', () => {
    expect(backupFilename(now)).toBe('tonus-backup-2026-10-01.json')
  })

  it('round-trips and strips ids', () => {
    const r = parse(valid())
    expect(r).toMatchObject({ ok: true })
    if (r.ok) {
      expect(r.backup.logs).toEqual([log])
      expect(r.backup.settings).toEqual(settings)
    }
  })

  it.each([
    ['not json', 'nope{'],
    ['wrong app', { ...valid(), app: 'other' }],
    ['wrong version', { ...valid(), version: 2 }],
    ['array', []],
    ['no settings', { ...valid(), settings: undefined }],
    ['bad settings day', { ...valid(), settings: { ...settings, trainingDays: [9] } }],
    ['logs not array', { ...valid(), logs: {} }],
    ['bad rating', { ...valid(), logs: [{ ...log, rating: 7 }] }],
    ['bad date', { ...valid(), logs: [{ ...log, finishedAt: 'x' }] }],
    ['bad completed', { ...valid(), logs: [{ ...log, completed: [1] }] }],
    ['bad bestHoldSec', { ...valid(), logs: [{ ...log, bestHoldSec: { a: 'x' } }] }],
  ])('rejects %s with a Hungarian message', (_n, input) => {
    const r = typeof input === 'string' ? parseBackup(input) : parse(input)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/[A-ZÁÉ]/)
  })
})

describe('needsBackupNudge', () => {
  const day = 86_400_000
  it.each([
    [undefined, 0, false],
    [undefined, 1, true],
    [new Date(now.getTime() - 30 * day).toISOString(), 3, false],
    [new Date(now.getTime() - 31 * day).toISOString(), 3, true],
    [new Date(now.getTime() - 31 * day).toISOString(), 0, false],
    ['garbage', 2, true],
  ])('last=%s logs=%s -> %s', (last, count, expected) => {
    expect(needsBackupNudge(last, count, now)).toBe(expected)
  })
})
