import type { SessionLog, Settings } from './types'

export const BACKUP_APP = 'tonus'
export const BACKUP_VERSION = 1
export const BACKUP_NUDGE_DAYS = 30

export type Backup = {
  app: typeof BACKUP_APP
  version: typeof BACKUP_VERSION
  exportedAt: string
  settings: Settings
  logs: SessionLog[]
}

export type ParsedBackup = { ok: true; backup: Backup } | { ok: false; error: string }

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isValidDate = (v: unknown): v is string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string')
const isNumberRecord = (v: unknown): boolean =>
  isObject(v) && Object.values(v).every((n) => typeof n === 'number' && Number.isFinite(n))

/** Why a log is malformed (English, developer-facing), or null when it is fine. */
export function logProblem(log: SessionLog): string | null {
  if (!log.sessionId) return 'sessionId is required'
  if (!isValidDate(log.startedAt) || !isValidDate(log.finishedAt)) return 'invalid date'
  if (!Number.isFinite(log.durationSec) || log.durationSec < 0) return 'invalid durationSec'
  if (!Number.isInteger(log.rating) || log.rating < 1 || log.rating > 5) {
    return 'rating must be 1-5'
  }
  return null
}

function isLog(v: unknown): v is SessionLog {
  if (!isObject(v)) return false
  if (typeof v.sessionId !== 'string') return false
  if (typeof v.durationSec !== 'number' || typeof v.rating !== 'number') return false
  if (!isStringArray(v.completed) || !isStringArray(v.usedEasier) || !isStringArray(v.areas)) {
    return false
  }
  if (v.note !== undefined && typeof v.note !== 'string') return false
  if (v.bestHoldSec !== undefined && !isNumberRecord(v.bestHoldSec)) return false
  if (v.bestReps !== undefined && !isNumberRecord(v.bestReps)) return false
  return logProblem(v as SessionLog) === null
}

function isSettings(v: unknown): v is Settings {
  if (!isObject(v) || v.id !== 'me' || !isValidDate(v.startDate)) return false
  if (!Array.isArray(v.trainingDays)) return false
  if (!v.trainingDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return false
  if (v.reminderTime !== undefined && typeof v.reminderTime !== 'string') return false
  if (v.reminderEnabled !== undefined && typeof v.reminderEnabled !== 'boolean') return false
  if (v.lastBackupAt !== undefined && !isValidDate(v.lastBackupAt)) return false
  return true
}

export function buildBackup(settings: Settings, logs: readonly SessionLog[], now: Date): Backup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings,
    logs: logs.map((l) => {
      const rest = { ...l }
      delete rest.id
      return rest
    }),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function backupFilename(now: Date): string {
  return `tonus-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

/** Parses and validates backup file text; the error is a Hungarian message. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'A fájl nem érvényes JSON.' }
  }
  if (!isObject(data) || data.app !== BACKUP_APP) {
    return { ok: false, error: 'Ez nem Tónus mentés.' }
  }
  if (data.version !== BACKUP_VERSION) {
    return { ok: false, error: 'A mentés verziója nem támogatott.' }
  }
  if (!isValidDate(data.exportedAt) || !isSettings(data.settings) || !Array.isArray(data.logs)) {
    return { ok: false, error: 'A mentés sérült vagy hiányos.' }
  }
  if (!data.logs.every(isLog)) {
    return { ok: false, error: 'A mentés edzésnaplója sérült.' }
  }
  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: data.exportedAt,
      settings: data.settings,
      logs: data.logs.map((l) => {
        const rest = { ...l }
        delete rest.id
        return rest
      }),
    },
  }
}

const DAY_MS = 86_400_000

/** True when there is something to lose (>= 1 log) and no backup in the last 30 days. */
export function needsBackupNudge(
  lastBackupAt: string | undefined,
  logCount: number,
  now: Date,
): boolean {
  if (logCount < 1) return false
  if (!lastBackupAt || Number.isNaN(Date.parse(lastBackupAt))) return true
  return now.getTime() - Date.parse(lastBackupAt) > BACKUP_NUDGE_DAYS * DAY_MS
}
