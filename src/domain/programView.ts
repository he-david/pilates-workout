import { dayNameShort } from './format'
import { nextSession } from './schedule'
import type { Phase, ProgramSession, SessionLog } from './types'

/** Pure helpers behind the Program screen. */

export type WeekStatus = 'done' | 'current' | 'upcoming'
export type PhaseState = 'done' | 'current' | 'locked'

export type WeekRow = {
  week: number
  phase: Phase
  sessions: ProgramSession[]
  doneCount: number
  total: number
  status: WeekStatus
  isAssessment: boolean
}

/** Sessions grouped by program week (program order), with completion status. */
export function buildWeekRows(
  program: readonly ProgramSession[],
  logs: readonly SessionLog[],
): WeekRow[] {
  const done = new Set(logs.map((l) => l.sessionId))
  const nextWeek = nextSession(program, logs)?.week
  const byWeek = new Map<number, ProgramSession[]>()
  for (const s of program) byWeek.set(s.week, [...(byWeek.get(s.week) ?? []), s])
  return [...byWeek.entries()].map(([week, sessions]) => {
    const doneCount = sessions.filter((s) => done.has(s.id)).length
    const total = sessions.length
    return {
      week,
      phase: sessions[0]?.phase ?? 1,
      sessions,
      doneCount,
      total,
      status: doneCount === total ? 'done' : week === nextWeek ? 'current' : 'upcoming',
      isAssessment: sessions.some((s) => s.isAssessment === true),
    }
  })
}

export function phaseState(phase: Phase, currentPhase: Phase, complete: boolean): PhaseState {
  if (complete || phase < currentPhase) return 'done'
  return phase === currentPhase ? 'current' : 'locked'
}

/** Short weekday labels of the training days, Monday first ("H", "Cs", "Szo"). */
export function weekdayLetters(trainingDays: readonly number[]): string[] {
  return [...trainingDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => dayNameShort(d))
}
