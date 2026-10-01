import { sessionItems } from '../domain/todaySummary'
import type { ProgramSession, SessionLog } from '../domain/types'

/**
 * Dev-only fixture: `n` finished sessions on the latest training days before `today`
 * (oldest session first). Used by `?devDone=n` to view a mid-program state.
 */
export function seedLogs(
  program: readonly ProgramSession[],
  n: number,
  trainingDays: readonly number[],
  today: Date,
): SessionLog[] {
  const days: Date[] = []
  for (let back = 1; days.length < n && back < 400; back++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back, 18)
    if (trainingDays.includes(d.getDay())) days.unshift(d)
  }
  return days.flatMap((d, i) => {
    const session = program[i]
    if (!session) return []
    const finished = d.toISOString()
    return [
      {
        sessionId: session.id,
        startedAt: new Date(d.getTime() - 50 * 60000).toISOString(),
        finishedAt: finished,
        durationSec: 3000,
        completed: sessionItems(session).map((item) => item.exerciseId),
        usedEasier: [],
        rating: 4,
        areas: [],
      } satisfies SessionLog,
    ]
  })
}
