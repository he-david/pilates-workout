import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { program } from '../content/program'
import type { SessionLog } from '../domain/types'
import { DEFAULT_TRAINING_DAYS } from './defaultSettings'
import { seedLogs } from './devSeed'
import { useStoredLogs } from './logs'

/**
 * Finished sessions, live from the device. `undefined` while loading (screens render nothing
 * until then, so no empty-state flash). In dev builds only, `?devDone=7` replaces them with
 * 7 fake finished sessions to preview mid-program states.
 */
export function useLogs(today: Date): SessionLog[] | undefined {
  const { search } = useLocation()
  const stored = useStoredLogs()
  const seeded = useMemo(() => {
    if (!import.meta.env.DEV) return undefined
    const n = Number(new URLSearchParams(search).get('devDone'))
    return Number.isInteger(n) && n > 0
      ? seedLogs(program, n, DEFAULT_TRAINING_DAYS, today)
      : undefined
  }, [search, today])
  return seeded ?? stored
}
