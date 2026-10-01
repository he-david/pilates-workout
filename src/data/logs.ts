import { useLiveQuery } from 'dexie-react-hooks'
import type { SessionLog } from '../domain/types'
import { db } from './db'

function validate(log: SessionLog): void {
  const dates = [log.startedAt, log.finishedAt]
  if (!log.sessionId) throw new Error('saveLog: sessionId is required')
  if (dates.some((d) => Number.isNaN(Date.parse(d)))) throw new Error('saveLog: invalid date')
  if (!Number.isFinite(log.durationSec) || log.durationSec < 0) {
    throw new Error('saveLog: invalid durationSec')
  }
  if (!Number.isInteger(log.rating) || log.rating < 1 || log.rating > 5) {
    throw new Error('saveLog: rating must be 1-5')
  }
}

/** Stores a finished session; returns its new id. Throws on a malformed log. */
export async function saveLog(log: SessionLog): Promise<number> {
  validate(log)
  const rest: SessionLog = { ...log }
  delete rest.id
  return (await db.logs.add(rest)) as number
}

/** All logs, oldest finished first. */
export async function listLogs(): Promise<SessionLog[]> {
  return db.logs.orderBy('finishedAt').toArray()
}

/** Live logs: undefined while loading. */
export function useStoredLogs(): SessionLog[] | undefined {
  return useLiveQuery(() => listLogs(), [])
}
