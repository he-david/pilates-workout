import { describe, expect, it } from 'vitest'
import {
  TRANSITION_MS,
  blockProgress,
  buildSteps,
  completedExerciseIds,
  createPlayer,
  currentStep,
  elapsedMs,
  finishSummary,
  playerReducer,
  progress,
  remainingMs,
  toSnapshot,
  upNext,
  type PlayerAction,
  type PlayerState,
} from '../../src/domain/player'
import type { ProgramSession, SessionItem } from '../../src/domain/types'

const reps = (id: string, est: number): SessionItem => ({
  exerciseId: id,
  dose: { kind: 'reps', reps: 8 },
  estSeconds: est,
})
const timed = (id: string, seconds: number, sets?: number): SessionItem => ({
  exerciseId: id,
  dose: { kind: 'time', seconds, sets },
  estSeconds: seconds * (sets ?? 1),
})

const session: ProgramSession = {
  id: 'w1-a',
  week: 1,
  slot: 'A',
  phase: 1,
  title: 't',
  warmup: [reps('a', 60)],
  main: [timed('b', 30, 2), reps('c', 90)],
  cooldown: [timed('d', 45)],
}
// steps: 0 a(reps) · 1 b set1 · 2 b set2 · 3 c(reps) · 4 d

const T0 = 1_000_000
const run = (s: PlayerState, ...actions: PlayerAction[]) => actions.reduce(playerReducer, s)
const fresh = () => createPlayer(session)
const started = () => run(fresh(), { type: 'start', now: T0 })

describe('buildSteps', () => {
  it('flattens blocks in order, one step per set', () => {
    const steps = buildSteps(session)
    expect(steps.map((s) => [s.exerciseId, s.set, s.sets, s.kind, s.durationMs])).toEqual([
      ['a', 1, 1, 'reps', 60_000],
      ['b', 1, 2, 'time', 30_000],
      ['b', 2, 2, 'time', 30_000],
      ['c', 1, 1, 'reps', 90_000],
      ['d', 1, 1, 'time', 45_000],
    ])
    expect(steps.map((s) => s.block)).toEqual(['warmup', 'main', 'main', 'main', 'cooldown'])
    expect(steps.map((s) => s.itemIndex)).toEqual([0, 1, 1, 2, 3])
  })
  it('handles an empty session', () => {
    const empty = { ...session, warmup: [], main: [], cooldown: [] }
    const s = playerReducer(createPlayer(empty), { type: 'start', now: T0 })
    expect(s.phase).toBe('finished')
  })
})

describe('start / timer', () => {
  it('idle -> running with endsAt from now', () => {
    const s = started()
    expect(s.phase).toBe('running')
    expect(s.endsAt).toBe(T0 + 60_000)
    expect(remainingMs(s, T0 + 10_000)).toBe(50_000)
  })
  it('ignores start when already started', () => {
    const s = started()
    expect(playerReducer(s, { type: 'start', now: T0 + 5 })).toBe(s)
  })
  it('idle shows full duration', () => {
    expect(remainingMs(fresh(), T0)).toBe(60_000)
  })
})

describe('rep items', () => {
  it('do not auto-advance when the guide time runs out', () => {
    const s = playerReducer(started(), { type: 'tick', now: T0 + 500_000 })
    expect(s.phase).toBe('running')
    expect(s.index).toBe(0)
    expect(remainingMs(s, T0 + 500_000)).toBe(0)
    expect(progress(s, T0 + 500_000)).toBe(1)
  })
  it('advance with done into a 10 s transition', () => {
    const s = playerReducer(started(), { type: 'done', now: T0 + 20_000 })
    expect(s.phase).toBe('transition')
    expect(s.index).toBe(1)
    expect(s.endsAt).toBe(T0 + 20_000 + TRANSITION_MS)
    expect(s.doneSteps).toEqual([0])
  })
})

describe('time items and transitions', () => {
  const atB1 = () => run(started(), { type: 'done', now: T0 }, { type: 'skip', now: T0 + 1000 })
  it('skip in a transition starts the next step immediately', () => {
    const s = atB1()
    expect(s.phase).toBe('running')
    expect(s.index).toBe(1)
    expect(s.endsAt).toBe(T0 + 1000 + 30_000)
  })
  it('transition expires on tick and starts the next step', () => {
    const s = run(started(), { type: 'done', now: T0 }, { type: 'tick', now: T0 + 9_999 })
    expect(s.phase).toBe('transition')
    const t = playerReducer(s, { type: 'tick', now: T0 + 10_000 })
    expect(t.phase).toBe('running')
    expect(t.index).toBe(1)
  })
  it('time step auto-advances at endsAt', () => {
    const s = atB1()
    const before = playerReducer(s, { type: 'tick', now: T0 + 1000 + 29_999 })
    expect(before.phase).toBe('running')
    const after = playerReducer(s, { type: 'tick', now: T0 + 1000 + 30_000 })
    expect(after.phase).toBe('transition')
    expect(after.index).toBe(2)
    expect(after.doneSteps).toContain(1)
  })
  it('skip marks the exercise as not done', () => {
    const s = playerReducer(started(), { type: 'skip', now: T0 })
    expect(s.doneSteps).toEqual([])
    expect(completedExerciseIds(s)).toEqual([])
  })
  it('upNext points at the step after current, or the upcoming one in a transition', () => {
    const s = started()
    expect(upNext(s)?.exerciseId).toBe('b')
    const t = playerReducer(s, { type: 'done', now: T0 })
    expect(upNext(t)?.exerciseId).toBe('b')
    expect(currentStep(t)?.exerciseId).toBe('b')
  })
})

describe('frozen / throttled tab (large now jumps)', () => {
  it('a long freeze on a time step advances only one boundary and does not skip exercises', () => {
    const s = run(started(), { type: 'done', now: T0 }, { type: 'skip', now: T0 })
    const late = T0 + 3_600_000
    const a = playerReducer(s, { type: 'tick', now: late })
    expect(a.phase).toBe('transition')
    expect(a.index).toBe(2)
    expect(a.endsAt).toBe(late + TRANSITION_MS)
    expect(a.doneSteps).toEqual([0, 1])
    const b = playerReducer(a, { type: 'tick', now: late + 1 })
    expect(b.index).toBe(2)
    expect(b.phase).toBe('transition')
  })
  it('a frozen transition starts the next step with a full duration from now', () => {
    const s = playerReducer(started(), { type: 'done', now: T0 })
    const late = T0 + 999_999
    const t = playerReducer(s, { type: 'tick', now: late })
    expect(t.phase).toBe('running')
    expect(t.endsAt).toBe(late + 30_000)
  })
  it('remaining never goes negative', () => {
    expect(remainingMs(started(), T0 + 10_000_000)).toBe(0)
  })
})

describe('pause / resume', () => {
  it('stores remaining and resumes from the new now', () => {
    const p = playerReducer(started(), { type: 'pause', now: T0 + 15_000 })
    expect(p.phase).toBe('paused')
    expect(p.pausedRemaining).toBe(45_000)
    expect(remainingMs(p, T0 + 999_000)).toBe(45_000)
    const r = playerReducer(p, { type: 'resume', now: T0 + 100_000 })
    expect(r.phase).toBe('running')
    expect(r.endsAt).toBe(T0 + 145_000)
  })
  it('tick does nothing while paused', () => {
    const p = run(started(), { type: 'done', now: T0 }, { type: 'pause', now: T0 + 1 })
    expect(playerReducer(p, { type: 'tick', now: T0 + 99_999_999 })).toBe(p)
  })
  it('pausing a transition resumes into the transition', () => {
    const p = run(started(), { type: 'done', now: T0 }, { type: 'pause', now: T0 + 4000 })
    expect(p.pausedIn).toBe('transition')
    expect(p.pausedRemaining).toBe(6000)
    const r = playerReducer(p, { type: 'resume', now: T0 + 50_000 })
    expect(r.phase).toBe('transition')
    expect(r.endsAt).toBe(T0 + 56_000)
  })
  it('pause/resume are no-ops in the wrong phase', () => {
    expect(playerReducer(fresh(), { type: 'pause', now: T0 })).toEqual(fresh())
    const s = started()
    expect(playerReducer(s, { type: 'resume', now: T0 })).toBe(s)
    const p = playerReducer(s, { type: 'pause', now: T0 })
    expect(playerReducer(p, { type: 'pause', now: T0 + 5 })).toBe(p)
  })
  it('done while paused advances and clears the pause', () => {
    const p = run(started(), { type: 'pause', now: T0 + 5 }, { type: 'done', now: T0 + 50 })
    expect(p.phase).toBe('transition')
    expect(p.pausedAt).toBeNull()
  })
})

describe('prev', () => {
  it('restarts the first step', () => {
    const s = playerReducer(started(), { type: 'prev', now: T0 + 30_000 })
    expect(s.index).toBe(0)
    expect(s.endsAt).toBe(T0 + 30_000 + 60_000)
  })
  it('goes back one step from a running step', () => {
    const s = run(
      started(),
      { type: 'skip', now: T0 },
      { type: 'skip', now: T0 },
      { type: 'prev', now: T0 + 5 },
    )
    expect(s.index).toBe(0)
    expect(s.phase).toBe('running')
  })
  it('from a transition returns to the step just finished', () => {
    const s = run(started(), { type: 'done', now: T0 }, { type: 'prev', now: T0 + 5 })
    expect(s.index).toBe(0)
    expect(s.phase).toBe('running')
  })
  it('keeps done marks', () => {
    const s = run(started(), { type: 'done', now: T0 }, { type: 'prev', now: T0 + 5 })
    expect(s.doneSteps).toEqual([0])
  })
})

describe('useEasier', () => {
  it('completes all sets of the item and records the exercise', () => {
    const s = run(
      started(),
      { type: 'skip', now: T0 },
      { type: 'skip', now: T0 },
      { type: 'useEasier', now: T0 + 10 },
    )
    expect(s.usedEasier).toEqual(['b'])
    expect(s.doneSteps).toEqual([1, 2])
    expect(s.phase).toBe('transition')
    expect(s.index).toBe(3)
  })
  it('does not duplicate and is ignored in a transition', () => {
    const t = playerReducer(started(), { type: 'done', now: T0 })
    expect(playerReducer(t, { type: 'useEasier', now: T0 })).toBe(t)
  })
})

describe('finishing', () => {
  const allDone = () => {
    let s = started()
    let now = T0
    for (let i = 0; i < 5; i++) {
      now += 1000
      s = playerReducer(s, { type: 'done', now })
      now += 1000
      s = playerReducer(s, { type: 'skip', now })
    }
    return { s, now }
  }
  it('ends after the last done', () => {
    const { s } = allDone()
    expect(s.phase).toBe('finished')
    expect(s.finishedAt).not.toBeNull()
    expect(completedExerciseIds(s)).toEqual(['a', 'b', 'c', 'd'])
    expect(progress(s, T0)).toBe(1)
    expect(toSnapshot(s, T0)).toBeUndefined()
  })
  it('freezes elapsed time', () => {
    const { s, now } = allDone()
    expect(elapsedMs(s, now + 1_000_000)).toBe(elapsedMs(s, now))
  })
  it('timed last step finishes via tick', () => {
    let s = started()
    for (let i = 0; i < 8; i++) s = playerReducer(s, { type: 'skip', now: T0 })
    expect(s.index).toBe(4)
    s = playerReducer(s, { type: 'tick', now: T0 + 45_000 })
    expect(s.phase).toBe('finished')
  })
  it('partial progress lists only fully done items', () => {
    const s = run(
      started(),
      { type: 'done', now: T0 },
      { type: 'skip', now: T0 },
      { type: 'done', now: T0 },
    )
    expect(completedExerciseIds(s)).toEqual(['a'])
  })
})

describe('selectors', () => {
  it('blockProgress gives position and segments within the block', () => {
    let s = started()
    expect(blockProgress(s)).toEqual({
      block: 'warmup',
      position: 1,
      total: 1,
      segments: ['current'],
    })
    s = run(s, { type: 'done', now: T0 }, { type: 'skip', now: T0 })
    expect(blockProgress(s)).toEqual({
      block: 'main',
      position: 1,
      total: 2,
      segments: ['current', 'pending'],
    })
    s = run(s, { type: 'skip', now: T0 }, { type: 'skip', now: T0 }, { type: 'skip', now: T0 })
    expect(blockProgress(s)?.segments).toEqual(['done', 'current'])
  })
  it('progress is the elapsed fraction of the step', () => {
    expect(progress(started(), T0 + 15_000)).toBeCloseTo(0.25)
    const t = playerReducer(started(), { type: 'done', now: T0 })
    expect(progress(t, T0 + 5000)).toBeCloseTo(0.5)
  })
  it('elapsed excludes pauses', () => {
    const s = run(
      started(),
      { type: 'pause', now: T0 + 10_000 },
      { type: 'resume', now: T0 + 70_000 },
    )
    expect(elapsedMs(s, T0 + 80_000)).toBe(20_000)
    const p = playerReducer(s, { type: 'pause', now: T0 + 90_000 })
    expect(elapsedMs(p, T0 + 500_000)).toBe(30_000)
    expect(elapsedMs(fresh(), T0)).toBe(0)
  })
})

describe('snapshot', () => {
  const idle = () => createPlayer(session)
  it('round-trips a running step (restores paused with the same remaining)', () => {
    const s = run(started(), { type: 'done', now: T0 + 1000 }, { type: 'skip', now: T0 + 2000 })
    const snap = toSnapshot(s, T0 + 12_000)
    expect(snap).toMatchObject({
      sessionId: 'w1-a',
      index: 1,
      at: 'step',
      endsAt: T0 + 32_000,
      doneSteps: [0],
      elapsedMs: 12_000,
    })
    const r = playerReducer(idle(), { type: 'restore', snapshot: snap!, now: T0 + 20_000 })
    expect(r.phase).toBe('paused')
    expect(r.pausedIn).toBe('step')
    expect(r.pausedRemaining).toBe(12_000)
    expect(r.doneSteps).toEqual([0])
    expect(elapsedMs(r, T0 + 20_000)).toBe(12_000)
    const go = playerReducer(r, { type: 'resume', now: T0 + 25_000 })
    expect(go.endsAt).toBe(T0 + 37_000)
  })
  it('round-trips a paused state', () => {
    const p = run(started(), { type: 'pause', now: T0 + 15_000 })
    const snap = toSnapshot(p, T0 + 99_000)!
    expect(snap.pausedRemaining).toBe(45_000)
    expect(snap.endsAt).toBeUndefined()
    const r = playerReducer(idle(), { type: 'restore', snapshot: snap, now: T0 + 200_000 })
    expect(r.pausedRemaining).toBe(45_000)
    expect(snap.elapsedMs).toBe(15_000)
  })
  it('restores a transition', () => {
    const s = playerReducer(started(), { type: 'done', now: T0 })
    const snap = toSnapshot(s, T0 + 3000)!
    expect(snap.at).toBe('transition')
    const r = playerReducer(idle(), { type: 'restore', snapshot: snap, now: T0 + 5000 })
    expect(r.pausedIn).toBe('transition')
    expect(r.pausedRemaining).toBe(5000)
    expect(upNext(r)?.exerciseId).toBe('b')
  })
  it('after time passed: expired time step restarts at full duration', () => {
    let s = started()
    for (let i = 0; i < 4; i++) s = playerReducer(s, { type: 'skip', now: T0 })
    const snap = toSnapshot(s, T0)!
    const r = playerReducer(idle(), { type: 'restore', snapshot: snap, now: T0 + 9_999_999 })
    expect(r.index).toBe(2)
    expect(r.pausedRemaining).toBe(30_000)
  })
  it('after time passed: expired rep step and transition show 0', () => {
    const rep = toSnapshot(started(), T0)!
    expect(
      playerReducer(idle(), { type: 'restore', snapshot: rep, now: T0 + 9e6 }).pausedRemaining,
    ).toBe(0)
    const tr = toSnapshot(playerReducer(started(), { type: 'done', now: T0 }), T0)!
    expect(
      playerReducer(idle(), { type: 'restore', snapshot: tr, now: T0 + 9e6 }).pausedRemaining,
    ).toBe(0)
  })
  it('rejects a snapshot of another session or bad index, or when already started', () => {
    const snap = toSnapshot(started(), T0)!
    expect(
      playerReducer(idle(), { type: 'restore', snapshot: { ...snap, sessionId: 'x' }, now: T0 }),
    ).toEqual(idle())
    expect(
      playerReducer(idle(), { type: 'restore', snapshot: { ...snap, index: 99 }, now: T0 }),
    ).toEqual(idle())
    const s = started()
    expect(playerReducer(s, { type: 'restore', snapshot: snap, now: T0 })).toBe(s)
  })
  it('idle has no snapshot', () => {
    expect(toSnapshot(idle(), T0)).toBeUndefined()
  })
})

describe('inactive phases ignore actions', () => {
  it.each(['done', 'skip', 'prev', 'tick', 'useEasier', 'pause', 'resume'] as const)(
    '%s in idle',
    (type) => {
      const s = fresh()
      expect(playerReducer(s, { type, now: T0 })).toBe(s)
    },
  )
})

describe('manual finish', () => {
  it('ignores finish while idle or already finished', () => {
    expect(playerReducer(fresh(), { type: 'finish', now: T0 }).phase).toBe('idle')
    const f = playerReducer(started(), { type: 'finish', now: T0 + 1000 })
    expect(playerReducer(f, { type: 'finish', now: T0 + 5000 }).finishedAt).toBe(T0 + 1000)
  })
  it('finishes mid-session, also from pause, and summarises', () => {
    const s = run(
      started(),
      { type: 'done', now: T0 + 2000 },
      { type: 'skip', now: T0 + 3000 },
      { type: 'pause', now: T0 + 4000 },
      { type: 'finish', now: T0 + 14_000 },
    )
    expect(s.phase).toBe('finished')
    expect(finishSummary(s, T0 + 99_000)).toEqual({
      sessionId: 'w1-a',
      startedAt: T0,
      finishedAt: T0 + 14_000,
      durationSec: 4,
      completed: ['a'],
      usedEasier: [],
    })
  })
})

describe('pre-selected easier variants', () => {
  it('are logged as used only once the exercise is completed', () => {
    const idle = createPlayer(session, ['a', 'c'])
    let s = run(idle, { type: 'start', now: T0 }, { type: 'done', now: T0 + 1 })
    expect(finishSummary(s, T0 + 2).usedEasier).toEqual(['a'])
    s = run(s, { type: 'finish', now: T0 + 3 })
    expect(finishSummary(s, T0 + 4).usedEasier).toEqual(['a'])
  })
  it('merge with easier variants tapped in the player without duplicates', () => {
    const s = run(
      createPlayer(session, ['a']),
      { type: 'start', now: T0 },
      { type: 'useEasier', now: T0 + 1 },
    )
    expect(finishSummary(s, T0 + 2).usedEasier).toEqual(['a'])
  })
})
