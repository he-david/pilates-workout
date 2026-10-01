import { prescribe } from './progression'
import { nextSession } from './schedule'
import { previousSameSlot } from './todaySummary'
import type { Prescription, ProgramSession, SessionLog } from './types'

/**
 * The session as it should be performed: the adaptive prescription applies only to the
 * next session (first one without a log); every other session is shown as authored.
 */
export function effectiveSession(
  program: readonly ProgramSession[],
  sessionId: string,
  logs: readonly SessionLog[],
): Prescription | undefined {
  const session = program.find((s) => s.id === sessionId)
  if (!session) return undefined
  if (nextSession(program, logs)?.id !== sessionId) {
    return {
      session,
      rule: 'none',
      modified: [],
      easierPreselected: [],
      harderSwapped: [],
      notes: [],
    }
  }
  return prescribe(session, logs, previousSameSlot(program, session))
}
