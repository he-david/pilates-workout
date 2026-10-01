import type { PlayerSnapshot, ProgramSession, SessionItem } from './types'

export const TRANSITION_MS = 10_000

export type BlockKey = 'warmup' | 'main' | 'cooldown'

/** One thing the player does: a rep item, or one set of a time item. */
export type Step = {
  /** position in the flat step list */
  id: number
  exerciseId: string
  /** position of the item in the whole session */
  itemIndex: number
  block: BlockKey
  /** 0-based item position within its block, and the block size */
  blockItemIndex: number
  blockItemCount: number
  /** 1-based set number and total sets (1 / 1 for rep items) */
  set: number
  sets: number
  item: SessionItem
  kind: 'reps' | 'time'
  /** time items: the countdown; rep items: estSeconds as a soft guide */
  durationMs: number
}

export type PlayerPhase = 'idle' | 'running' | 'paused' | 'transition' | 'finished'

export type PlayerState = {
  sessionId: string
  steps: readonly Step[]
  phase: PlayerPhase
  /** current step, or the upcoming step while in a transition */
  index: number
  /** set while running or in a transition */
  endsAt: number | null
  /** set while paused */
  pausedRemaining: number | null
  /** what a pause interrupted */
  pausedIn: 'step' | 'transition' | null
  doneSteps: readonly number[]
  usedEasier: readonly string[]
  startedAt: number | null
  pausedAt: number | null
  pausedTotal: number
  finishedAt: number | null
}

export type PlayerAction =
  | { type: 'start'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'done'; now: number }
  | { type: 'skip'; now: number }
  | { type: 'prev'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'useEasier'; now: number }
  | { type: 'restore'; snapshot: PlayerSnapshot; now: number }

const BLOCKS: readonly BlockKey[] = ['warmup', 'main', 'cooldown']

/** Flatten a session: time items with sets become one step per set. */
export function buildSteps(session: ProgramSession): Step[] {
  const steps: Step[] = []
  let itemIndex = 0
  for (const block of BLOCKS) {
    const items = session[block]
    items.forEach((item, blockItemIndex) => {
      const isTime = item.dose.kind === 'time'
      const sets = item.dose.kind === 'time' ? Math.max(1, item.dose.sets ?? 1) : 1
      const seconds = item.dose.kind === 'time' ? item.dose.seconds : item.estSeconds
      for (let set = 1; set <= sets; set++) {
        steps.push({
          id: steps.length,
          exerciseId: item.exerciseId,
          itemIndex,
          block,
          blockItemIndex,
          blockItemCount: items.length,
          set,
          sets,
          item,
          kind: isTime ? 'time' : 'reps',
          durationMs: seconds * 1000,
        })
      }
      itemIndex++
    })
  }
  return steps
}

export function createPlayer(session: ProgramSession): PlayerState {
  return {
    sessionId: session.id,
    steps: buildSteps(session),
    phase: 'idle',
    index: 0,
    endsAt: null,
    pausedRemaining: null,
    pausedIn: null,
    doneSteps: [],
    usedEasier: [],
    startedAt: null,
    pausedAt: null,
    pausedTotal: 0,
    finishedAt: null,
  }
}

// ---------- internal transitions ----------

function beginStep(state: PlayerState, index: number, now: number): PlayerState {
  const step = state.steps[index]
  if (!step) return finish(state, now)
  return {
    ...state,
    phase: 'running',
    index,
    endsAt: now + step.durationMs,
    pausedRemaining: null,
    pausedIn: null,
    pausedAt: null,
  }
}

function finish(state: PlayerState, now: number): PlayerState {
  return {
    ...state,
    phase: 'finished',
    endsAt: null,
    pausedRemaining: null,
    pausedIn: null,
    pausedAt: null,
    finishedAt: now,
  }
}

/** After step `from` is over: transition to the next step, or finish. */
function advanceFrom(state: PlayerState, from: number, now: number): PlayerState {
  const next = from + 1
  if (next >= state.steps.length) return finish(state, now)
  return {
    ...state,
    phase: 'transition',
    index: next,
    endsAt: now + TRANSITION_MS,
    pausedRemaining: null,
    pausedIn: null,
    pausedAt: null,
  }
}

function withDone(state: PlayerState, ids: readonly number[]): PlayerState {
  const merged = [...new Set([...state.doneSteps, ...ids])].sort((a, b) => a - b)
  return { ...state, doneSteps: merged }
}

/** 'step' / 'transition' for an active player (also while paused), else null. */
function context(state: PlayerState): 'step' | 'transition' | null {
  if (state.phase === 'running') return 'step'
  if (state.phase === 'transition') return 'transition'
  if (state.phase === 'paused') return state.pausedIn
  return null
}

function remainingAt(state: PlayerState, now: number): number {
  if (state.phase === 'paused') return state.pausedRemaining ?? 0
  if (state.endsAt === null) return 0
  return Math.max(0, state.endsAt - now)
}

// ---------- reducer ----------

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  const { now } = action
  switch (action.type) {
    case 'start': {
      if (state.phase !== 'idle') return state
      if (state.steps.length === 0) return finish({ ...state, startedAt: now }, now)
      return beginStep({ ...state, startedAt: now, pausedTotal: 0 }, 0, now)
    }
    case 'pause': {
      const ctx = context(state)
      if (state.phase === 'paused' || ctx === null) return state
      return {
        ...state,
        phase: 'paused',
        pausedIn: ctx,
        pausedRemaining: remainingAt(state, now),
        endsAt: null,
        pausedAt: now,
      }
    }
    case 'resume': {
      if (state.phase !== 'paused' || state.pausedIn === null) return state
      return {
        ...state,
        phase: state.pausedIn === 'step' ? 'running' : 'transition',
        endsAt: now + (state.pausedRemaining ?? 0),
        pausedRemaining: null,
        pausedIn: null,
        pausedTotal: state.pausedTotal + (state.pausedAt === null ? 0 : now - state.pausedAt),
        pausedAt: null,
      }
    }
    case 'done':
    case 'skip': {
      const ctx = context(state)
      if (ctx === null) return state
      const resumed = unpause(state, now)
      if (ctx === 'transition') return beginStep(resumed, state.index, now)
      const marked = action.type === 'done' ? withDone(resumed, [state.index]) : resumed
      return advanceFrom(marked, state.index, now)
    }
    case 'prev': {
      const ctx = context(state)
      if (ctx === null) return state
      const target = ctx === 'transition' ? state.index - 1 : Math.max(0, state.index - 1)
      return beginStep(unpause(state, now), Math.max(0, target), now)
    }
    case 'tick': {
      if (state.phase === 'running') {
        const step = state.steps[state.index]
        if (!step || step.kind !== 'time' || state.endsAt === null || now < state.endsAt)
          return state
        return advanceFrom(withDone(state, [state.index]), state.index, now)
      }
      if (state.phase === 'transition') {
        if (state.endsAt === null || now < state.endsAt) return state
        return beginStep(state, state.index, now)
      }
      return state
    }
    case 'useEasier': {
      if (context(state) !== 'step') return state
      const step = state.steps[state.index]
      if (!step) return state
      const itemSteps = state.steps.filter((s) => s.itemIndex === step.itemIndex)
      const last = itemSteps[itemSteps.length - 1] ?? step
      const marked = withDone(
        {
          ...unpause(state, now),
          usedEasier: state.usedEasier.includes(step.exerciseId)
            ? state.usedEasier
            : [...state.usedEasier, step.exerciseId],
        },
        itemSteps.map((s) => s.id),
      )
      return advanceFrom(marked, last.id, now)
    }
    case 'restore':
      return restore(state, action.snapshot, now)
  }
}

/** Drop the paused flags (and bank the pause time) before leaving a paused step. */
function unpause(state: PlayerState, now: number): PlayerState {
  if (state.phase !== 'paused') return state
  return {
    ...state,
    pausedTotal: state.pausedTotal + (state.pausedAt === null ? 0 : now - state.pausedAt),
    pausedAt: null,
  }
}

// ---------- snapshot ----------

/** Snapshot to persist, or undefined when there is nothing to resume. */
export function toSnapshot(state: PlayerState, now: number): PlayerSnapshot | undefined {
  const ctx = context(state)
  if (ctx === null) return undefined
  const base = {
    sessionId: state.sessionId,
    index: state.index,
    at: ctx,
    doneSteps: [...state.doneSteps],
    usedEasier: [...state.usedEasier],
    elapsedMs: elapsedMs(state, now),
  }
  return state.phase === 'paused'
    ? { ...base, pausedRemaining: state.pausedRemaining ?? 0 }
    : { ...base, endsAt: state.endsAt ?? now }
}

/**
 * Restore always lands paused, so the user taps to continue. If the saved timer
 * already ran out while the app was closed: a time step restarts with its full
 * duration (no exercise is skipped), a rep step or transition shows 0.
 */
function restore(state: PlayerState, snap: PlayerSnapshot, now: number): PlayerState {
  const step = state.steps[snap.index]
  if (snap.sessionId !== state.sessionId || !step || state.phase !== 'idle') return state
  const full = snap.at === 'transition' ? TRANSITION_MS : step.durationMs
  let remaining: number
  if (snap.pausedRemaining !== undefined) remaining = snap.pausedRemaining
  else {
    const left = (snap.endsAt ?? now) - now
    remaining = left > 0 ? left : snap.at === 'step' && step.kind === 'time' ? full : 0
  }
  return {
    ...state,
    phase: 'paused',
    pausedIn: snap.at,
    index: snap.index,
    endsAt: null,
    pausedRemaining: Math.min(Math.max(0, remaining), full),
    doneSteps: [...snap.doneSteps].sort((a, b) => a - b),
    usedEasier: [...snap.usedEasier],
    startedAt: now - snap.elapsedMs,
    pausedAt: now,
    pausedTotal: 0,
    finishedAt: null,
  }
}

// ---------- selectors ----------

export function currentStep(state: PlayerState): Step | undefined {
  return state.steps[state.index]
}

/** The step shown under "Következő": the one after the current, or the upcoming one in a transition. */
export function upNext(state: PlayerState): Step | undefined {
  return state.steps[context(state) === 'transition' ? state.index : state.index + 1]
}

export function remainingMs(state: PlayerState, now: number): number {
  if (state.phase === 'idle') return state.steps[state.index]?.durationMs ?? 0
  return remainingAt(state, now)
}

/** Ring fill 0..1 for the current step or transition. */
export function progress(state: PlayerState, now: number): number {
  const step = currentStep(state)
  if (!step || state.phase === 'finished') return state.phase === 'finished' ? 1 : 0
  const total = context(state) === 'transition' ? TRANSITION_MS : step.durationMs
  if (total <= 0) return 1
  return Math.min(1, Math.max(0, 1 - remainingMs(state, now) / total))
}

export type SegmentState = 'done' | 'current' | 'pending'

export type BlockProgress = {
  block: BlockKey
  /** 1-based item position in the block */
  position: number
  total: number
  segments: SegmentState[]
}

/** Header progress: one segment per item of the current step's block. */
export function blockProgress(state: PlayerState): BlockProgress | undefined {
  const step = currentStep(state)
  if (!step) return undefined
  const done = completedItems(state)
  const items = state.steps.filter((s) => s.block === step.block && s.set === 1)
  return {
    block: step.block,
    position: step.blockItemIndex + 1,
    total: step.blockItemCount,
    segments: items.map((s) =>
      s.itemIndex === step.itemIndex
        ? 'current'
        : done.has(s.itemIndex) || s.itemIndex < step.itemIndex
          ? 'done'
          : 'pending',
    ),
  }
}

function completedItems(state: PlayerState): Set<number> {
  const done = new Set(state.doneSteps)
  const result = new Set<number>()
  for (const step of state.steps) {
    if (result.has(step.itemIndex)) continue
    const all = state.steps.filter((s) => s.itemIndex === step.itemIndex)
    if (all.every((s) => done.has(s.id))) result.add(step.itemIndex)
  }
  return result
}

/** exerciseIds whose every set was finished (skipped items are not included). */
export function completedExerciseIds(state: PlayerState): string[] {
  const items = completedItems(state)
  const ids: string[] = []
  for (const step of state.steps) {
    if (items.has(step.itemIndex) && !ids.includes(step.exerciseId)) ids.push(step.exerciseId)
  }
  return ids
}

/** Active workout time in ms: pauses excluded, frozen once finished. */
export function elapsedMs(state: PlayerState, now: number): number {
  if (state.startedAt === null) return 0
  const end = state.finishedAt ?? state.pausedAt ?? now
  return Math.max(0, end - state.startedAt - state.pausedTotal)
}
