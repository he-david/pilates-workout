import type { ProgramSession } from '../domain/types'
import { buildProgram } from './program/build'
import { slotPlans } from './program/slots'

export { ASSESSMENT_WEEKS, WEEKS } from './program/build'
export { assessmentDescription, phases, type PhaseInfo } from './program/phases'

/**
 * The 36-session program (12 weeks x A/B/C) in play order.
 * HUMAN REVIEW needed (physical safety): doses, progression and exercise order.
 */
export const program: readonly ProgramSession[] = buildProgram(slotPlans)

const byId = new Map(program.map((s) => [s.id, s]))

export function getSession(id: string): ProgramSession | undefined {
  return byId.get(id)
}
