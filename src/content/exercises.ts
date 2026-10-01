import type { Exercise } from '../domain/types'
import { advancedExercises } from './exercises/advanced'
import { cooldownExercises } from './exercises/cooldown'
import { matExercises } from './exercises/mat'
import { propExercises } from './exercises/props'
import { warmupExercises } from './exercises/warmup'

/** Full exercise library. HUMAN REVIEW needed before use (physical safety). */
export const exercises: readonly Exercise[] = [
  ...warmupExercises,
  ...matExercises,
  ...propExercises,
  ...advancedExercises,
  ...cooldownExercises,
]

const byId = new Map(exercises.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id)
}
