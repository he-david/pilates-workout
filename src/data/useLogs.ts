import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { program } from '../content/program'
import type { SessionLog } from '../domain/types'
import { DEFAULT_TRAINING_DAYS } from './defaultSettings'
import { seedLogs } from './devSeed'

const NONE: SessionLog[] = []

/**
 * Finished sessions. Stub until the Dexie store lands (M4): always empty in production.
 * In dev builds only, `?devDone=7` fakes 7 finished sessions to preview mid-program states.
 */
export function useLogs(today: Date): SessionLog[] {
  const { search } = useLocation()
  return useMemo(() => {
    if (!import.meta.env.DEV) return NONE
    const n = Number(new URLSearchParams(search).get('devDone'))
    return Number.isInteger(n) && n > 0 ? seedLogs(program, n, DEFAULT_TRAINING_DAYS, today) : NONE
  }, [search, today])
}
