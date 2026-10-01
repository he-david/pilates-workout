import { getExercise } from '../../content/exercises'
import { doseShort } from '../../domain/format'
import type { Step } from '../../domain/player'

/** "8 ism.", "45 mp", "2/3. sorozat" suffix for multi-set time items. */
export function stepDose(step: Step): string {
  const repUnit = getExercise(step.exerciseId)?.repUnit
  const dose = step.item.dose
  const single = dose.kind === 'time' ? { ...dose, sets: 1 } : dose
  const base = doseShort(single, repUnit)
  return step.sets > 1 ? `${base} · ${step.set}/${step.sets}. sorozat` : base
}
