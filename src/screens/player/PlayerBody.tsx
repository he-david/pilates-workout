import { getExercise } from '../../content/exercises'
import { progress as ringProgress, type PlayerState, type Step } from '../../domain/player'
import { Icon, Ring } from '../../ui'
import { stepDose } from './stepDose'

function clock(seconds: number): string {
  const s = Math.max(0, seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function statusText(state: PlayerState, step: Step): string {
  if (state.phase === 'idle') return 'koppints az indításhoz'
  if (state.phase === 'paused') return 'szünetel — koppints a lejátszásra'
  if (state.phase === 'transition') return 'pihenő — mindjárt indulunk'
  return step.kind === 'reps' ? 'ajánlott idő' : 'hátralévő idő'
}

type Props = { state: PlayerState; step: Step; now: number; secondsLeft: number }

export function PlayerBody({ state, step, now, secondsLeft }: Props) {
  const ex = getExercise(step.exerciseId)
  const inTransition =
    state.phase === 'transition' || (state.phase === 'paused' && state.pausedIn === 'transition')
  const ring = inTransition ? 'var(--color-pink-strong)' : 'var(--color-accent-deep)'
  const p = state.phase === 'idle' ? 0 : ringProgress(state, now)
  return (
    <>
      <div className="flex flex-col gap-1">
        {inTransition && (
          <div className="text-sm font-extrabold tracking-label-wide text-warn-ink uppercase">
            Pihenő · következő
          </div>
        )}
        <h1 className="text-4xl font-extrabold tracking-tight-display">
          {ex?.nameHu ?? step.exerciseId}
        </h1>
        <div className="text-md font-semibold text-ink-body">
          {ex?.nameEn} · {stepDose(step)}
        </div>
      </div>
      <div className="flex h-[260px] items-center justify-center">
        <Ring progress={p} size={220} stroke={12} trackColor="var(--color-surface)" color={ring}>
          <div className="flex max-w-[170px] flex-col items-center gap-0.5 text-center">
            <div
              className="text-timer font-extrabold tracking-tight-display tabular-nums"
              role="timer"
              aria-label="hátralévő idő"
            >
              {clock(secondsLeft)}
            </div>
            <div className="text-base font-semibold text-ink-body">{statusText(state, step)}</div>
          </div>
        </Ring>
      </div>
      {ex && (
        <div className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3.5">
          <Icon name="breath" size={20} className="mt-0.5 shrink-0 text-streak" />
          <div className="text-md leading-normal">{ex.cue}</div>
        </div>
      )}
    </>
  )
}
