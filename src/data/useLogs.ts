import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { program } from '../content/program'
import type { Rating, SessionLog } from '../domain/types'
import { DEFAULT_TRAINING_DAYS } from './defaultSettings'
import { seedLogs } from './devSeed'
import { useStoredLogs } from './logs'

const DEV_KEY = 'devSeed'

/** Dev-only `?devDone=n&devRating=r`; remembered per tab so in-app links keep the seed. `?devDone=0` clears. */
function devParams(search: string): { done: number; rating: Rating | undefined } {
  let query = search
  try {
    if (new URLSearchParams(search).has('devDone')) sessionStorage.setItem(DEV_KEY, search)
    else query = sessionStorage.getItem(DEV_KEY) ?? ''
  } catch {
    // storage unavailable: use the URL only
  }
  const p = new URLSearchParams(query)
  const done = Number(p.get('devDone'))
  const r = Number(p.get('devRating'))
  return {
    done: Number.isInteger(done) && done > 0 ? done : 0,
    rating: r >= 1 && r <= 5 && Number.isInteger(r) ? (r as Rating) : undefined,
  }
}

/**
 * Finished sessions, live from the device. `undefined` while loading (screens render nothing
 * until then, so no empty-state flash). In dev builds only, `?devDone=7` (plus optional `&devRating=1..5` for the newest one) replaces them with
 * 7 fake finished sessions to preview mid-program states.
 */
export function useLogs(today: Date): SessionLog[] | undefined {
  const { search } = useLocation()
  const stored = useStoredLogs()
  const seeded = useMemo(() => {
    if (!import.meta.env.DEV) return undefined
    const { done, rating } = devParams(search)
    return done > 0 ? seedLogs(program, done, DEFAULT_TRAINING_DAYS, today, rating) : undefined
  }, [search, today])
  return seeded ?? stored
}
