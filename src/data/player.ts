import { useLiveQuery } from 'dexie-react-hooks'
import type { PlayerSnapshot } from '../domain/types'
import { db, PLAYER_KEY } from './db'

export async function saveSnapshot(snapshot: PlayerSnapshot): Promise<void> {
  await db.player.put(snapshot, PLAYER_KEY)
}

export async function loadSnapshot(): Promise<PlayerSnapshot | undefined> {
  return db.player.get(PLAYER_KEY)
}

export async function clearSnapshot(): Promise<void> {
  await db.player.delete(PLAYER_KEY)
}

/** Live snapshot: undefined while loading, null when none is saved. */
export function useSnapshot(): PlayerSnapshot | null | undefined {
  return useLiveQuery(async () => (await loadSnapshot()) ?? null, [])
}
