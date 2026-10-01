import { sessionItems } from '../domain/todaySummary'
import type { ProgramSession, Rating, SessionLog } from '../domain/types'

const RATINGS: readonly Rating[] = [3, 2, 3, 2, 3, 3, 2, 3]

/** Week 4 baseline (plank 25 s, easier Roll Up), later assessments improve. */
function assessmentFixture(week: number): Partial<SessionLog> {
  if (week <= 4) return { bestHoldSec: { 'forearm-plank': 25 }, usedEasier: ['roll-up'] }
  return {
    bestHoldSec: { 'forearm-plank': week >= 12 ? 55 : 40 },
    bestReps: { 'roll-up': week >= 12 ? 12 : 8 },
  }
}

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
    const assessment = session.isAssessment ? assessmentFixture(session.week) : {}
    return [
      {
        sessionId: session.id,
        startedAt: new Date(d.getTime() - 50 * 60000).toISOString(),
        finishedAt: finished,
        durationSec: 3000,
        completed: sessionItems(session).map((item) => item.exerciseId),
        usedEasier: [],
        rating: RATINGS[i % RATINGS.length] ?? 3,
        areas: [],
        ...assessment,
      } satisfies SessionLog,
    ]
  })
}
