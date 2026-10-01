export type Equipment = 'mat' | 'ball' | 'ring' | 'band' | 'weights'

export type RepUnit = 'count' | 'direction'

export type Exercise = {
  id: string
  nameHu: string
  nameEn: string
  focus: string[]
  equipment: Equipment[]
  steps: string[]
  mistakes: string[]
  easier: string
  harder: string
  cue: string
  /** e.g. "3 le · 3 fel" */
  tempo?: string
  /** How a rep dose is counted when it is not plain repetitions: "100 számolás", "5 / irány". */
  repUnit?: RepUnit
  media?: string
}

export type Dose =
  | { kind: 'reps'; reps: number; perSide?: boolean }
  | { kind: 'time'; seconds: number; sets?: number }

export type SessionItem = {
  exerciseId: string
  dose: Dose
  estSeconds: number
  isNew?: boolean
}

export type SessionSlot = 'A' | 'B' | 'C'
export type Phase = 1 | 2 | 3

export type ProgramSession = {
  id: string
  week: number
  slot: SessionSlot
  phase: Phase
  title: string
  isAssessment?: boolean
  warmup: SessionItem[]
  main: SessionItem[]
  cooldown: SessionItem[]
}

export type Rating = 1 | 2 | 3 | 4 | 5

export type SessionLog = {
  id?: number
  sessionId: string
  startedAt: string
  finishedAt: string
  durationSec: number
  completed: string[]
  usedEasier: string[]
  rating: Rating
  areas: string[]
  note?: string
  bestHoldSec?: Record<string, number>
}

export type Settings = {
  id: 'me'
  startDate: string
  trainingDays: number[]
  reminderTime?: string
}

/** Output of prescribe(): the session as it should be performed next. */
export type Prescription = {
  session: ProgramSession
  /** exerciseIds whose easier variant is pre-selected */
  easierPreselected: string[]
  /** exerciseIds swapped to the harder variant */
  harderSwapped: string[]
  /** human-readable reasons (Hungarian), shown on the overview */
  notes: string[]
}

/** Saved at every transition and pause so a closed app can resume in place. */
export type PlayerSnapshot = {
  sessionId: string
  /** index into the flattened step list */
  index: number
  /** whether `index` is the step being performed or the upcoming step in a transition */
  at: 'step' | 'transition'
  /** ms timestamp when the running timer ends; absent while paused */
  endsAt?: number
  /** ms left when paused; absent while running */
  pausedRemaining?: number
  /** indexes of finished steps */
  doneSteps: number[]
  /** exerciseIds done with the easier variant */
  usedEasier: string[]
  /** active workout time (pauses excluded) at the moment of saving */
  elapsedMs: number
}
