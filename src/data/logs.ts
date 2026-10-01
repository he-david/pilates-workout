import { useLiveQuery } from 'dexie-react-hooks'
import { logProblem } from '../domain/backup'
import type { SessionLog } from '../domain/types'
import { db } from './db'

function validate(log: SessionLog): void {
  const problem = logProblem(log)
  if (problem) throw new Error(`saveLog: ${problem}`)
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
