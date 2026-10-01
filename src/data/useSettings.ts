import { useMemo } from 'react'
import type { Settings } from '../domain/types'
import { defaultSettings } from './defaultSettings'

/** Settings. Stub returning defaults until the settings store lands (T15/T18). */
export function useSettings(today: Date): Settings {
  return useMemo(() => defaultSettings(today), [today])
}
