import Dexie, { type EntityTable, type Table } from 'dexie'
import type { PlayerSnapshot, SessionLog, Settings } from '../domain/types'

export const DB_NAME = 'tonus'
/** Fixed key of the single resume snapshot in the `player` table. */
export const PLAYER_KEY = 'active'

export type TonusDb = Dexie & {
  logs: EntityTable<SessionLog, 'id'>
  settings: EntityTable<Settings, 'id'>
  /** out-of-line key: one row under PLAYER_KEY */
  player: Table<PlayerSnapshot, string>
}

export function createDb(name: string = DB_NAME): TonusDb {
  const db = new Dexie(name) as TonusDb
  // v1. Any later schema change: add db.version(2) with an upgrade, never edit this.
  db.version(1).stores({
    logs: '++id, sessionId, finishedAt',
    settings: 'id',
    player: '',
  })
  return db
}

export const db: TonusDb = createDb()
