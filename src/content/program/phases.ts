import type { Phase } from '../../domain/types'

export type PhaseInfo = {
  phase: Phase
  title: string
  description: string
  /** Inclusive week range. */
  fromWeek: number
  toWeek: number
  level: number
  /** Exercise ids shown as chips on the Program screen (empty for phase 1). */
  highlights: readonly string[]
}

export const phases: readonly PhaseInfo[] = [
  {
    phase: 1,
    title: 'Alapozás',
    description:
      'Pilates-légzés, középtest aktiválás, gerinc mobilitás. Csak matrac, opcionális kis labda.',
    fromWeek: 1,
    toWeek: 4,
    level: 1,
    highlights: [],
  },
  {
    phase: 2,
    title: 'Építés',
    description:
      'Kis labda, Pilates-gyűrű és gumiszalag. Hosszabb tartások, lassabb tempó, oldalsó sorozatok.',
    fromWeek: 5,
    toWeek: 8,
    level: 2,
    highlights: ['side-plank', 'swimming', 'saw', 'ball-bridge'],
  },
  {
    phase: 3,
    title: 'Kihívás',
    description:
      'A klasszikus mat repertoár haladó elemei, folyamatos átmenetekkel, kevesebb pihenővel.',
    fromWeek: 9,
    toWeek: 12,
    level: 3,
    highlights: ['teaser', 'rollover', 'corkscrew', 'push-up'],
  },
]

/** Shown under an assessment week on the Program screen. */
export const assessmentDescription = 'Plank-teszt, roll up ismétlésszám'
