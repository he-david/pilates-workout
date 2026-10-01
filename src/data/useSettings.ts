import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import type { Settings } from '../domain/types'
import { defaultSettings } from './defaultSettings'
import { getSettings } from './settings'

/** Live settings; defaults (start = today) while loading or before the first-run init. */
export function useSettings(today: Date): Settings {
  const stored = useLiveQuery(async () => (await getSettings()) ?? null, [])
  return useMemo(() => stored ?? defaultSettings(today), [stored, today])
}
