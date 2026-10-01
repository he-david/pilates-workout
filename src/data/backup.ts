import { buildBackup, backupFilename, parseBackup } from '../domain/backup'
import { shareFile } from '../platform/share'
import { db, PLAYER_KEY } from './db'
import { defaultSettings } from './defaultSettings'
import { listLogs } from './logs'

export type ImportResult = { ok: true; count: number } | { ok: false; error: string }

/**
 * Builds the backup file and hands it to the share sheet / download.
 * Records `lastBackupAt` only when the file actually left the app. Returns whether it did.
 * (The Log screen calls this instead of platform/ directly; data/ owns the side effect.)
 */
export async function exportBackup(now: Date): Promise<boolean> {
  const stored = (await db.settings.get('me')) ?? defaultSettings(now)
  // the file already carries the new date, so a restored device knows it is freshly backed up
  const settings = { ...stored, lastBackupAt: now.toISOString() }
  const logs = await listLogs()
  const json = JSON.stringify(buildBackup(settings, logs, now), null, 2)
  const file = new File([json], backupFilename(now), { type: 'application/json' })
  const result = await shareFile(file)
  if (result === 'cancelled') return false
  await db.settings.put(settings)
  return true
}

/** Replaces all logs and settings with the backup's (replace, not merge: one user, one device). */
export async function importBackup(text: string): Promise<ImportResult> {
  const parsed = parseBackup(text)
  if (!parsed.ok) return parsed
  const { settings, logs } = parsed.backup
  await db.transaction('rw', db.logs, db.settings, db.player, async () => {
    await db.logs.clear()
    await db.settings.clear()
    await db.player.delete(PLAYER_KEY)
    await db.logs.bulkAdd(logs)
    await db.settings.put(settings)
  })
  return { ok: true, count: logs.length }
}
